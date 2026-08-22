"""POST /api/projects/analyze — extract structured requirements from a project brief."""

from fastapi import APIRouter

from app.schemas import ProjectAnalyzeRequest, ProjectAnalyzeResponse
from app.services.project_analyzer import analyze_project

router = APIRouter(prefix="/api", tags=["projects"])


@router.post("/projects/analyze", response_model=ProjectAnalyzeResponse)
def analyze_project_endpoint(payload: ProjectAnalyzeRequest) -> ProjectAnalyzeResponse:
    """Analyze a project description and extract structured requirements.
    
    Uses LLM when available, falls back to keyword extraction.
    """
    result = analyze_project(payload.description)
    return ProjectAnalyzeResponse(
        domain=result["domain"],
        required_skills=result["required_skills"],
        roles=result["roles"],
    )
