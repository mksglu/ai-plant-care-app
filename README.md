# Plant Care App

A meteorological research tool for plant care, helping users manage their plants based on weather data and AI-powered health analysis.

## Features

- **Plant Management**: Add, edit, and delete plants with detailed information.
- **Weather Data Integration**: Uses Open-Meteo API to fetch historical weather data.
- **Health Analysis**: Calculates plant health based on weather data and plant requirements.
- **AI-Powered Insights**: Uses Gemini AI to provide detailed analysis and recommendations.
- **Health Tracking**: Visualizes plant health over time with historical charts.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions
- **Database**: Neon DB (PostgreSQL)
- **AI Integration**: Google Gemini AI
- **Weather Data**: Open-Meteo Historical Forecast API
- **Deployment**: Docker, Docker Compose

## Project Structure

The project follows a domain-driven design approach:

```
app/                 # Next.js application
  plant/             # Plant-related pages
  ...
domains/             # Domain-driven structure
  plant/             # Plant domain
    actions/         # Server actions
    components/      # Domain-specific components
    schema.sql       # Database schema
  health/            # Health domain
    actions/
    components/
    http/            # External API clients
    lib/             # Domain-specific libraries
    schema.sql
  household/         # Household domain (for future multi-location support)
```

## Environment Variables

Create a `.env` file with the following variables:

```
# Database Configuration (Neon DB)
DATABASE_URL=postgres://user:password@host:port/database

# For Database Initialization Service
DB_HOST=db.example.com
DB_USER=dbuser
DB_PASSWORD=dbpassword
DB_NAME=dbname

# Gemini AI API Configuration
GEMINI_API_KEY=your_gemini_api_key

# Application Settings
NODE_ENV=development
```

## Setup & Installation

### Using Docker (Recommended)

1. Create a `.env` file with the required variables
2. Build and start the container:
   ```bash
   docker-compose up -d
   ```

3. Initialize the database (first time only):
   ```bash
   docker-compose --profile db-tools up db-init
   ```

### Development Mode

For development with hot-reloading:

```bash
docker-compose --profile dev up app-dev
```

### Local Setup (Without Docker)

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Set up the database:
   - Create a Neon DB account and database
   - Run the schema files in `domains/*/schema.sql`

3. Create a `.env` file with necessary environment variables

4. Start the development server:
   ```bash
   yarn dev
   ```

## Key Design Decisions

1. **Domain-Driven Design**: Organized code by business domains rather than technical layers.
2. **Server Actions**: Used Next.js Server Actions instead of REST APIs for simplified data operations.
3. **AI Integration with Caching**: Implemented Gemini AI analysis with database caching for efficiency.
4. **Type Safety**: Strong TypeScript typing with Zod validation for external data.

## Future Improvements

- Implement chart visualization for health history
- Add user authentication
- Support for multiple households/locations
- Mobile responsiveness improvements
- Add searching and filtering capabilities
- Implement pagination for users with many plants 