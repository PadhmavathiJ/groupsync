# GroupSync

Plan together. Meet smarter. Settle easily.

GroupSync is a full-stack group coordination platform that helps groups solve three common problems:

- When should we meet?
- Where should we meet?
- How should we split expenses?

## Core Flow

Create Group → Find When → Find Where → Meet → Split & Settle

## Features

### MeetWhen
Automatically compares member schedules and finds ranked common meeting slots.

### MeetMiddle
Finds suitable meeting places and ranks them based on fairness or total travel efficiency.

### Shared Expenses
Records group expenses, splits costs between participants, and calculates member balances.

### Group Dashboard
Displays members, upcoming meetings, recent expenses, and current balances.

## Technical Highlights

- Interval merging and schedule intersection
- Ranked availability calculation
- Haversine geographic distance calculation
- Fairness vs efficiency optimization
- Expense aggregation and net balance calculation
- REST-style backend APIs
- MongoDB persistence
- External location API integration

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- REST APIs
- Vercel

## Project Structure

```text
GroupSync
├── MeetWhen
├── MeetMiddle
├── Expenses
├── Groups & Members
├── Next.js API Routes
└── MongoDB