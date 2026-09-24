# THREAD - Decision Intelligence System

THREAD is a full-stack decision intelligence application designed to help users structure complex decisions, compare alternatives, evaluate trade-offs, and preserve the reasoning behind their choices.

Instead of treating decisions as simple notes or task items, THREAD provides a structured workspace where users can define a decision, create options, establish weighted criteria, score alternatives, visualize relationships, and track the decision through its lifecycle.

## Live Application

**Frontend:** https://thread-client-two.vercel.app

**Backend API:** https://thread-api-1kwd.onrender.com

**API Health Check:** https://thread-api-1kwd.onrender.com/api/v1/health

## Backend Repository

https://github.com/FAVOUR-EGBUNA/thread-api

---

## Overview

Important decisions often involve several competing options, priorities, assumptions, and trade-offs.

THREAD was built to make that reasoning explicit.

A user can create a decision workspace, define the available options, establish the criteria that matter, assign weights to those criteria, evaluate each option, and use the resulting analysis to support a final decision.

The application combines structured decision modelling with a visual interface so that the reasoning behind a decision remains understandable and traceable.

---

## Core Features

### Decision Workspaces

Create and manage individual decision threads with their own context, status, options, criteria, and analysis.

### Options

Define the alternatives being considered within a decision and keep them organised in one workspace.

### Weighted Criteria

Create evaluation criteria and assign weights based on their relative importance to the decision.

### Option Scoring

Score individual options against defined criteria to create a structured comparison between alternatives.

### Decision Analysis

Use the collected criteria, weights, and scores to understand how different options perform against the priorities of the decision.

### Visual Decision Mapping

THREAD uses React Flow to provide an interactive visual representation of decision information and relationships.

### Decision Lifecycle

Track decisions through different stages instead of treating them as isolated records.

### Authentication

Secure account creation and login allow each user to access and manage their own decision data.

### Responsive Interface

The application is designed to remain usable across desktop and smaller screen sizes.

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod
- React Flow

### Backend

The THREAD frontend communicates with a separate REST API built with:

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod
- JWT Authentication

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: PostgreSQL

---

## Application Architecture

THREAD follows a separated frontend/backend architecture.

```text
User
  |
  v
React + TypeScript Frontend
  |
  | REST API
  v
Node.js + Express API
  |
  v
Prisma ORM
  |
  v
PostgreSQL Database
```

The frontend is responsible for the user interface, client-side state, forms, validation, server-state management, and decision visualisation.

The backend handles authentication, business logic, validation, persistence, and access to decision data.

---

## Frontend Responsibilities

The frontend application handles:

- Authentication flows
- Decision workspace interfaces
- Option management
- Criteria management
- Weight configuration
- Score entry
- Decision analysis presentation
- Interactive decision visualisation
- Form validation
- API communication
- Loading and error states
- Responsive layouts

TanStack Query is used to manage asynchronous server state and API requests, while React Hook Form and Zod provide structured form handling and validation.

---

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- Git

### Clone the Repository

```bash
git clone https://github.com/FAVOUR-EGBUNA/thread-client.git
cd thread-client
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root and configure the frontend API URL.

```env
VITE_API_URL=your_backend_api_url
```

For local development, point this variable to the locally running THREAD API.

### Start Development Server

```bash
npm run dev
```

Vite will start the development server and display the local application URL in the terminal.

---

## Production Build

Create an optimized production build with:

```bash
npm run build
```

The generated production files will be placed in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

---

## Backend

THREAD uses a separate backend repository for its REST API, authentication, business logic, and PostgreSQL persistence.

**Repository:**

https://github.com/FAVOUR-EGBUNA/thread-api

**Production API:**

https://thread-api-1kwd.onrender.com

---

## Quality Assurance

Before production deployment, the THREAD application was tested across its core workflows.

The backend test suite currently contains:

```text
119 tests passed
```

The application was also verified through production testing of the deployed frontend and API.

---

## Project Purpose

THREAD was created as a portfolio-grade full-stack engineering project focused on solving a problem beyond standard CRUD functionality.

The project demonstrates:

- Full-stack application architecture
- Relational data modelling
- REST API integration
- Authentication and authorization
- Complex form state
- Schema validation
- Server-state management
- Decision modelling
- Interactive data visualisation
- Responsive frontend development
- Production deployment
- Automated backend testing

---

## Author

**Favour Egbuna**

Full-Stack Developer

GitHub: https://github.com/FAVOUR-EGBUNA
