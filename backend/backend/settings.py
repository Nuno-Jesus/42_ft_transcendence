"""
Django settings for backend project.

Generated by 'django-admin startproject' using Django 4.2.11.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from pathlib import Path
import os

from dotenv import load_dotenv



# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

BASE_DIR_R = Path(__file__).resolve().parent.parent.parent
env_path = os.path.join(BASE_DIR_R,'.env')
load_dotenv(dotenv_path=env_path)

TOKEN_URL_A=os.getenv("TOKEN_URL")
CLIENT_ID_A=os.getenv("CLIENT_ID")
CLIENT_SECRET_A=os.getenv("CLIENT_SECRET")
REDIRECT_URI_A=os.getenv("REDIRECT_URI")
USER_INFO_URL_A=os.getenv("USER_INFO_URL")



# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-b4amhal1@gob1$prnqgr*chry7pneej76qsy^p+5$m!w&#$qyy'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True


LOGOUT_REDIRECT_URL = "login"
LOGIN_REDIRECT_URL = ''
LOGIN_URL = 'login'

ALLOWED_HOSTS = ['*']
APPEND_SLASH = False

# Use the default session backend
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # Banco de dados para armazenar sessões

# Ensure sessions are saved and managed properly
SESSION_SAVE_EVERY_REQUEST = True  # Salva a sessão em cada request, opcional

# Secure session settings
SESSION_COOKIE_SECURE = False  # Deve ser True em produção, requer HTTPS
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # Define se a sessão expira ao fechar o navegador

CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = True
# Application definition

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework', #django rest framework
    'rest_framework_swagger',
    'drf_yasg',
    "pong",
    'bootstrap4',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]



ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR,'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = "backend.asgi.application"



ACCOUNT_EMAIL_VERIFICATION = "none"


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'postgres', 
        'USER': 'anaraujo',
        'PASSWORD': '1234',
        'HOST': 'postgres', 
        'PORT': '5432',
    }
}

REST_FRAMEWORK = { 
    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    # 'DEFAULT_PERMISSION_CLASSES': [
    #     'rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly'
    # ]
    #  For a quick way to limit permissions to authenticated users, we add the following to our settings file:
    # 'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',)

    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema' 
}

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

AUTH_USER_MODEL = 'pong.Users'


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/
STATIC_URL = 'static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

CRISPY_TEMPLATE_PACK = 'bootstrap4'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_USE_TLS = True
EMAIL_PORT = 587
EMAIL_HOST_USER = 'andreiacampos98.15@gmail.com'
EMAIL_HOST_PASSWORD = 'nfvzbxadhvgzfgpq'


# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis-container', 6379)],
        },
    },
}