# Generated by Django 5.1.1 on 2024-09-17 17:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0003_userstats_nb_tournaments_played_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='users',
            name='user_42',
            field=models.IntegerField(null=True),
        ),
    ]