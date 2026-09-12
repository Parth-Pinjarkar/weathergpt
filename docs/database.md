# WeatherGPT — Database Schema & Data Models

WeatherGPT utilizes SQLAlchemy ORM with a normalized relational schema supporting SQLite in local/demo deployments and PostgreSQL in production environments.

## Entity Relationship Architecture

```mermaid
erDiagram
    USERS ||--o{ USER_PREFERENCES : has
    USERS ||--o{ SAVED_LOCATIONS : bookmarks
    USERS ||--o{ ROUTE_HISTORY : analyzes
    USERS ||--o{ CHAT_SESSIONS : owns
    USERS ||--o{ USER_SESSIONS : logs
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : contains

    USERS {
        int id PK
        string email UK
        string hashed_password
        string name
        string role
        boolean is_active
        datetime last_login
        datetime created_at
    }

    USER_PREFERENCES {
        int id PK
        int user_id FK
        string temp_unit
        string wind_unit
        boolean notifications_enabled
        string preferred_location
        string language
        string risk_sensitivity
    }

    SAVED_LOCATIONS {
        int id PK
        int user_id FK
        string name
        string city
        float lat
        float lon
        datetime created_at
    }

    WEATHER_CACHE {
        int id PK
        string location UK
        text data
        datetime updated_at
        datetime ttl_expires_at
    }

    OFFICIAL_ALERTS {
        int id PK
        string location
        string severity
        string title
        text description
        string expected_period
        text impacts
        datetime expires_at
        boolean is_active
    }

    EMERGENCY_LOCATIONS {
        string id PK
        string name
        string category
        string city
        string address
        string phone
        string capacity
        float lat
        float lon
        boolean is_open_24x7
        int available_capacity
        boolean is_accepting
    }

    KNOWLEDGE_DOCUMENTS {
        int id PK
        string title
        string category
        string source
        text content
        string keywords
        datetime created_at
    }

    ROUTE_HISTORY {
        int id PK
        int user_id FK
        string from_location
        string to_location
        string departure_time
        string overall_risk_level
        int risk_score
        text summary
        datetime created_at
    }
```

## Table Specifications

### 1. `users`
- Stores user credentials, BCrypt password hashes, account roles (`general`, `farmer`, `traveller`, `disaster`, `school`), and lifecycle timestamps.

### 2. `user_preferences`
- Stores unit settings (`celsius`/`fahrenheit`, `kmh`/`mph`/`ms`), language preferences (`en`, `hi`, `mr`), and risk sensitivity factors.

### 3. `saved_locations`
- Bookmarked cities and GPS coordinates for fast one-tap dashboard access.

### 4. `weather_cache`
- Persistent secondary cache tier with JSON payloads and explicit `ttl_expires_at` invalidation timestamps.

### 5. `emergency_locations`
- Relief shelters, tertiary hospitals, and NDRF/SDRF disaster response command bases with real-time capacity and contact numbers.

### 6. `knowledge_documents`
- Curated disaster guidelines, IMD meteorological standards, and agricultural mitigation strategies for RAG indexing.
