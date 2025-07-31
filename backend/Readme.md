# Installation (backend)

[!Note] After cloning this repo open backend folder:
```bash
$ cd backend
```

## 1. Create virtual environment
```bash
$ python -m venv venv
```
## 2. Activate venv
- In Linux:
```bash
$ source venv/bin/activate
```
- In Windows
```bash
$ .\venv\Scripts\activate
```

## 3. Install requirements
```bash
$ pip install -r requirements.txt
```

## 4. Copy `.env.dist` file and create `.env` file
```bash
$ cp .env.dist .env
```

## 5. Open `.env` file and edit it, replace your environment variables.
In linux open with nano or other editor
```bash
$ nano .env
```

## 6. Migrate database
```bash
$ python manage.py migrate
```

## 7. Create default records
```bash
$ python manage.py create_defaults
```

## 8. Backend is ready, run server
```bash
$ python manage.py runserver
```
