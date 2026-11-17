import os

from auth import hash_password
from database.db import SessionLocal
from database.models import User, UserRole


def seed_user(db, username: str, password: str, role: UserRole) -> None:
    existing = db.query(User).filter_by(username=username).first()
    if existing:
        print(f"Пользователь '{username}' уже существует — пропуск")
        return
    db.add(User(username=username, password_hash=hash_password(password), role=role))
    print(f"Создан пользователь '{username}' (роль: {role.value})")


def main():
    admin_password = os.environ.get("SEED_ADMIN_PASSWORD", "admin123")
    user_password = os.environ.get("SEED_USER_PASSWORD", "user123")

    db = SessionLocal()
    try:
        seed_user(db, "admin", admin_password, UserRole.ADMIN)
        seed_user(db, "user", user_password, UserRole.USER)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
