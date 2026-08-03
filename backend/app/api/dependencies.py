"""Shared authentication and ownership dependencies."""

from typing import Annotated

from fastapi import Depends, HTTPException, Path, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config.settings import settings
from app.models.analysis import AnalysisRepository
from app.models.user import User, UserRepository
from app.services.auth_service import AuthService, InvalidCredentialsError

bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service() -> AuthService:
    """Build the stateless authentication service."""
    return AuthService(
        UserRepository(settings.database_path),
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
        access_token_minutes=settings.access_token_minutes,
    )


def get_analysis_repository() -> AnalysisRepository:
    """Build the analysis ownership repository."""
    return AnalysisRepository(settings.database_path)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    """Resolve the bearer token or return a standards-compliant 401."""
    if credentials is None:
        raise _unauthorized()
    try:
        return service.user_from_token(credentials.credentials)
    except InvalidCredentialsError as error:
        raise _unauthorized() from error


def require_analysis_owner(
    analysis_id: Annotated[str, Path()],
    user: Annotated[User, Depends(get_current_user)],
    analyses: Annotated[AnalysisRepository, Depends(get_analysis_repository)],
) -> User:
    """Authorize access while avoiding cross-user resource disclosure."""
    if not analyses.belongs_to(analysis_id, user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found."
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OwnedAnalysisUser = Annotated[User, Depends(require_analysis_owner)]
AnalysisRepositoryDependency = Annotated[
    AnalysisRepository, Depends(get_analysis_repository)
]


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": "Bearer"},
    )
