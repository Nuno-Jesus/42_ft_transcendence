# Generated by Django 5.1.2 on 2024-10-17 19:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userstats',
            name='date_longest_game',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='userstats',
            name='date_max_ball_speed',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='userstats',
            name='date_max_rally_length',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='userstats',
            name='date_quickest_game',
            field=models.DateTimeField(null=True),
        ),
    ]
