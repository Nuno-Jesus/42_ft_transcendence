import json
from ..views import tournament_init_phase
from ..models import Tournaments, TournamentsGames, TournamentsUsers, Users
from ..serializers import GamesSerializer, TournamentsGamesSerializer, TournamentsUsersSerializer, UsersSerializer
from icecream import ic

from asgiref.sync import sync_to_async
from django_redis import get_redis_connection
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

phase_after = dict(zip(
	['Last 16', 'Quarter-final', 'Semi-final', 'Final'], 
	['Quarter-final', 'Semi-final', 'Final', None]
))

phase_of = dict(zip(
	[16, 8, 4], 
	['Last 16', 'Quarter-final', 'Semi-final']
))


class TournamentConsumer(AsyncWebsocketConsumer):
	# active_tournaments = {}

	async def connect(self):
		await self.accept()
		self.user = self.scope['user']
		self.redis = get_redis_connection('default')
		self.tournament_id = self.scope["url_route"]["kwargs"]["tournament_id"]
		self.tournament_channel = f'tournament_{self.tournament_id}'
		self.tournament_instance = await self.get_tournament()

		# Add user to the tournament wide channel
		await self.channel_layer.group_add(self.tournament_channel, self.channel_name)

		# Create cache in redis about tournament (if it does not exist) and about the user
		await self.create_cache()
		await self.broadcast_player_list()

		if self.is_tournament_full():
			first_phase = self.get_cache(self.tournament_channel)['curr_phase']
			await self.begin_phase(first_phase, True)
		

	async def disconnect(self, code):
		#! IMPORTANT Use tournament_leave handler to remote the user from the database
		users = self.get_cache(f'{self.tournament_channel}_users')
		me = users[f'{self.user.id}']

		if me['game_channel']:
			await self.channel_layer.group_discard(me['game_channel'], self.channel_name)
		await self.channel_layer.group_discard(self.tournament_channel, self.channel_name)

		del users[f'{self.user.id}']
		self.set_cache(f'{self.tournament_channel}_users', users)

		return await super().disconnect(code)
	

	async def receive(self, text_data):
		message = json.loads(text_data)
		event = message['event']

		if event == 'GAME_END':
			await self.on_game_end(message['data'])


	# ! ============================== MESSAGING ===============================

	async def broadcast(self, event):		
		await self.send(text_data=event["message"])
	
	# ! ============================= REDIS ACCESS =============================

	def get_cache(self, key):
		data = self.redis.get(key)
		return json.loads(data.decode('UTF-8')) if data else None
	
	def set_cache(self, key, value):
		return self.redis.set(key, json.dumps(value))
	
	async def create_cache(self):
		tournament_state = {
			'last_phase': None, 
			'curr_phase': phase_of[self.tournament_instance.capacity],
			'curr_phase_total_games': self.tournament_instance.capacity // 2,
			'curr_phase_finished_games': 0
		}

		if not self.redis.exists(self.tournament_channel):
			self.set_cache(self.tournament_channel, tournament_state)

		tour_user = await self.get_tournament_user(self.user.id)

		tournament_users_data = self.get_cache(f'{self.tournament_channel}_users')
		if tournament_users_data is None:
			tournament_users_data = {}

		tournament_users_data[self.user.id] = {
			'id': self.user.id,
			'username': self.user.username,
			'channel_name': self.channel_name,
			'game_channel': '',
			'tour_user': tour_user,
			'has_finished_playing': False
		}
		self.set_cache(f'{self.tournament_channel}_users', tournament_users_data)

	# ! ============================= DATABASE ACCESS ==========================

	@database_sync_to_async
	def get_tournament(self):
		return Tournaments.objects.get(pk=self.tournament_id)
	
	@database_sync_to_async
	def get_tournament_user(self, user_id):
		tour_user = TournamentsUsers.objects.get(tournament_id=self.tournament_id, user_id=user_id)
		user = Users.objects.get(pk=user_id)

		data = TournamentsUsersSerializer(tour_user).data
		data['user'] = UsersSerializer(user).data

		return data

	@database_sync_to_async
	def get_tournament_users(self):
		users = TournamentsUsers.objects.filter(tournament_id=self.tournament_id)

		for tour_user in users:
			user_data = Users.objects.get(pk=tour_user['user_id']) 
			tour_user['user'] = UsersSerializer(user_data).data

		return TournamentsUsersSerializer(users, many=True).data

	@database_sync_to_async
	def get_tournament_phase_games(self, phase):
		return TournamentsGames.objects.filter(
			tournament_id=self.tournament_id, phase=phase
		)
	
	@database_sync_to_async
	def pair_players(self, tour_game, players, tournament_state):
		user1 = players[f'{tour_game.game_id.user1_id.id}']
		user2 = players[f'{tour_game.game_id.user2_id.id}']

		game_data = TournamentsGamesSerializer(tour_game).data
		game_data['game_id'] = GamesSerializer(tour_game.game_id).data
		game_data['user1_id'] = UsersSerializer(tour_game.game_id.user1_id).data
		game_data['user2_id'] = UsersSerializer(tour_game.game_id.user2_id).data
		game_data['phase'] = tournament_state['curr_phase'].lower()

		return game_data, user1, user2
	
	@database_sync_to_async
	def get_last_phase_results(self, last_phase):
		games = TournamentsGames.objects.filter(tournament_id=self.tournament_id, phase=last_phase)

		last_phase_scores = []
		for tour_game in games:
			game_data = {
				'id': tour_game.game_id.id,
				'username1': tour_game.game_id.user1_id.username,
				'username2': tour_game.game_id.user2_id.username,
				'score1': tour_game.game_id.nb_goals_user1,
				'score2': tour_game.game_id.nb_goals_user2,
			}
			last_phase_scores.append(game_data)

		winner = None
		if last_phase == 'Final':
			user = Tournaments.objects.get(pk=self.tournament_id).winner_id
			winner = TournamentsUsers.objects.get(tournament_id=self.tournament_id, user_id=user.id)
			winner = TournamentsUsersSerializer(winner).data
			winner['user'] = UsersSerializer(user).data

			# ! Maybe remove the tournament from cache?

		return last_phase_scores, winner
	

	# ! ===========================================================================

	def is_tournament_full(self):
		tournament_users = self.get_cache(f'{self.tournament_channel}_users')
		return len(tournament_users) == self.tournament_instance.capacity

	async def broadcast_player_list(self):
		curr_phase = self.get_cache(self.tournament_channel)['curr_phase']
		users_data = self.get_cache(f'{self.tournament_channel}_users')
		users = list(map(lambda x: x['tour_user'], users_data.values()))

		# Broadcast current list to all users
		await self.channel_layer.group_send(self.tournament_channel, {
			"type": "broadcast", 
			"message": json.dumps({
				'event': 'PLAYER_JOINED',
				'data': {
					'phase': curr_phase.lower(),
					'players': users
				}
			})
		})


	async def on_game_end(self, game_data):
		users = self.get_cache(f'{self.tournament_channel}_users')
		me = users[f'{self.user.id}']
		me['has_finished_playing'] = True
		self.set_cache(f'{self.tournament_channel}_users', users)

		if not self.redis.exists(me['game_channel']):
			self.set_cache(me['game_channel'], game_data)
		else:
			ic(f'Data for {me['game_channel']} already exists', game_data)
		
		[ic(f"{user['username']}, {user['has_finished_playing']}") for user in users.values()]

		all_players_confirmed = all([user['has_finished_playing'] for user in users.values()])
		if all_players_confirmed:
			await self.end_phase()
	

	async def begin_phase(self, phase, is_first_phase=False):
		# And now pair up the players in their rooms
		games = None
		if is_first_phase:
			games = await sync_to_async(tournament_init_phase)(self.tournament_id)
		else:
			games = await self.get_tournament_phase_games(phase)

		games_data = []
		players = self.get_cache(f'{self.tournament_channel}_users')
		tournament_state = self.get_cache(self.tournament_channel)

		for tour_game in games:
			game_data, p1, p2 = await self.pair_players(tour_game, players, tournament_state)
			games_data.append(game_data)

			game_channel = f'{self.tournament_channel}_game_{tour_game.id}'
			await self.channel_layer.group_add(game_channel, p1['channel_name'])
			await self.channel_layer.group_add(game_channel, p2['channel_name'])

			p1['game_channel'] = p2['game_channel'] = game_channel

		self.set_cache(f'{self.tournament_channel}_users', players)
			
		await self.channel_layer.group_send(self.tournament_channel, {
			"type": "broadcast", 
			"message": json.dumps({
				'event': 'PHASE_START',
				'data': {
					'phase': tournament_state['curr_phase'].lower(),
					'games': games_data
				}
			})
		})

	async def end_phase(self):
		tournament_state = self.get_cache(self.tournament_channel)
		tournament_state['last_phase'] = tournament_state['curr_phase']
		tournament_state['curr_phase'] = phase_after[tournament_state['last_phase']]
		tournament_state['curr_phase_total_games'] //= 2
		tournament_state['curr_phase_finished_games'] = 0
		self.set_cache(self.tournament_channel, tournament_state)
		ic('PHASE_END', tournament_state)

		results, winner = await self.get_last_phase_results(tournament_state['last_phase']) 

		await self.channel_layer.group_send(self.tournament_channel, {
			"type": "broadcast", 
			"message": json.dumps({
				"event": 'PHASE_END',
				"data": {
					'phase': tournament_state['last_phase'].lower(),
					'next_phase': tournament_state['curr_phase'].lower() if tournament_state['curr_phase'] else None,
					'results': results,
					'winner': winner,
				}
			})
		})


	

	# def on_game_finish(self, data):
	# 	ic('BEFORE', self.tournament['curr_phase'], self.tournament['curr_phase_total_games'], self.tournament['curr_phase_finished_games'])
	# 	self.tournament['curr_phase_finished_games'] += 1
	# 	winner = None
		
	# 	if self.tournament['curr_phase_finished_games'] < self.tournament['curr_phase_total_games']:
	# 		return 
		
	# 	# Replace information about the current phase with the next
	# 	last_phase = self.tournament['curr_phase']
	# 	last_phase_games = TournamentsGames.objects.filter(tournament_id=self.tournament_id, phase=last_phase)
	# 	self.tournament['curr_phase'] = phase_after[last_phase]
	# 	self.tournament['curr_phase_total_games'] //= 2
	# 	self.tournament['curr_phase_finished_games'] = 0
	# 	curr_phase = self.tournament['curr_phase']
	# 	curr_phase_games = TournamentsGames.objects.filter(tournament_id=self.tournament_id, phase=curr_phase)

	# 	# Join all phase winners
	# 	next_phase_users, last_phase_scores = [], []
	# 	ic(last_phase, curr_phase)
	# 	for tour_game in last_phase_games:
	# 		winnerID = tour_game.game_id.winner_id.id
			
	# 		tour_user = TournamentsUsers.objects.get(tournament_id=self.tournament_id, user_id=winnerID)
	# 		user = Users.objects.get(pk=tour_user.user_id.id) 
			
	# 		tour_user = TournamentsUsersSerializer(tour_user).data
	# 		tour_user['user'] = UsersSerializer(user).data
	# 		next_phase_users.append(tour_user)

	# 		username1, username2 = tour_game.game_id.user1_id.username, tour_game.game_id.user2_id.username
	# 		score1, score2 = tour_game.game_id.nb_goals_user1, tour_game.game_id.nb_goals_user2
	# 		game_data = {
	# 			'id': tour_game.game_id.id,
	# 			'username1': username1,
	# 			'username2': username2,
	# 			'score1': score1,
	# 			'score2': score2,
	# 		}
	# 		last_phase_scores.append(game_data)

	# 	if last_phase == 'Final':
	# 		user = Tournaments.objects.get(pk=self.tournament_id).winner_id
	# 		winner = TournamentsUsers.objects.get(tournament_id=self.tournament_id, user_id=user.id)
	# 		winner = TournamentsUsersSerializer(winner).data
	# 		winner['user'] = UsersSerializer(user).data
	# 		del self.active_tournaments[self.tournament_id]
					
	# 	# Send the new user pairs for the next phase
	# 	async_to_sync(self.channel_layer.group_send)(self.tournament_channel, {
	# 		"type": "broadcast", 
	# 		"message": json.dumps({
	# 			"event": 'PHASE_END',
	# 			"data": {
	# 				'phase': last_phase.lower(),
	# 				'next_phase': curr_phase.lower() if curr_phase else None,
	# 				'players': next_phase_users,
	# 				'results': last_phase_scores,
	# 				'winner': winner,
	# 			}
	# 		})
	# 	})

	# 	if last_phase != 'Final' and last_phase is not None:
	# 		self.begin_phase(curr_phase_games)
				



