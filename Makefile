all:
	docker compose up --build

detach:
	docker compose up --build -d

django:
	docker exec -it django-container sh -c 'source /.venv/bin/activate; sh'

migrations:
	docker exec -it django-container sh -c \
		'source /.venv/bin/activate; \
		python3 manage.py makemigrations; \
		python3 manage.py migrate'

clean:
	sudo rm -rf data/
	mkdir data/

prune:
	docker system prune

down:
	docker compose down

ps:
	docker compose ps

re: down all

.SILENT:
