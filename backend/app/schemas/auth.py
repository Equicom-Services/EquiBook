from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

    # Signals the frontend to force the password-change modal
    # before letting the admin into the dashboard.
    must_change_password: bool = False


class ChangePasswordRequest(BaseModel):
    new_password: str


class AdminResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool

    class Config:
        from_attributes = True