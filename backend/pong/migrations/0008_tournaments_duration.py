# Generated by Django 5.1.1 on 2024-09-19 21:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0007_remove_games_tournament'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournaments',
            name='duration',
            field=models.IntegerField(default=0),
        ),
    ]