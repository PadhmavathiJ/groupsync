# GroupSync — Product Requirements Document

## Product Overview

GroupSync is a full-stack group coordination platform that helps groups answer:

- WHEN should we meet?
- WHERE should we meet?
- HOW should we split the cost?

## Core Flow

Create Group → Add Members → Find Common Time → Find Fair Meeting Place → Create Meeting → Add Expenses → Calculate Balances → Settle

## Core Features

### Groups & Members
- Create groups
- Add members
- Store schedules
- Store meetings
- Store expenses

### MeetWhen
Calculates and ranks common meeting times using interval merging and intersection.

### MeetMiddle
Ranks candidate meeting locations using fairness and total travel distance.

### Shared Expenses
Supports:
- Payer selection
- Participants
- Equal split
- Custom split
- Balance calculation
- Settlements

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- Next.js Route Handlers
- Public Maps / Places API
- Vercel

## MVP

The core MVP is:

WHEN → WHERE → SETTLE