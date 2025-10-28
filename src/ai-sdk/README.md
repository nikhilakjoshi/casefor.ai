# AI SDK Configuration for Case Onboarding

This directory contains AI-powered tools for automated document processing and case information extraction.

## Features

### 1. Document Categorization (`categorize-documents.ts`)

- Uses Google's Gemini 1.5 Flash model
- Automatically categorizes legal documents into:
  - Contract
  - Evidence
  - Correspondence
  - Court Filing
  - Legal Brief
  - Medical Records
  - Financial Documents
  - Witness Statement
  - Other
- Returns confidence scores (0-1) for each categorization

### 2. Case Details Extraction (`extract-case-details.ts`)

- Uses Anthropic's Claude 3.5 Sonnet model
- Extracts structured information from legal documents:
  - Case title and number
  - Case type
  - Parties involved (with roles)
  - Important dates
  - Case summary
  - Key facts
  - Estimated value
  - Jurisdiction

## Setup

### Required API Keys

Add these environment variables to your `.env` file:

```bash
# Google AI (for document categorization)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key-here"

# Anthropic AI (for case detail extraction)
ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

### Getting API Keys

1. **Google AI API Key**

   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env` file

2. **Anthropic API Key**
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create an account and generate an API key
   - Copy the key to your `.env` file

## Usage

These functions are automatically called when documents are uploaded through the case creation flow at `/home/cases/new`.

### API Endpoint

`POST /api/documents/process`

Accepts FormData with multiple file uploads and returns:

```json
{
  "categories": [
    {
      "fileName": "contract.pdf",
      "category": "Contract",
      "confidence": 0.95
    }
  ],
  "caseDetails": {
    "caseTitle": "Smith vs. Corporation Inc.",
    "caseNumber": "2024-CV-001",
    "caseType": "Civil Litigation",
    "parties": [...],
    "summary": "...",
    "keyFacts": [...],
    ...
  }
}
```

## Important Notes

⚠️ **AI Accuracy**: While the AI models are highly accurate, they can make mistakes. Always review and verify the extracted information before creating a case.

📄 **Supported File Types**: PDF, DOC, DOCX, TXT, and common image formats

💰 **API Costs**: Both Google AI and Anthropic charge based on usage. Monitor your API usage in their respective dashboards.

## Error Handling

Both functions include try-catch blocks and will throw descriptive errors if:

- API keys are missing or invalid
- The AI service is unavailable
- The document content cannot be parsed
