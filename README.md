# FlashLearn

FlashLearn is an AI-powered learning platform that transforms your notes into interactive study materials. Using advanced natural language processing, it automatically generates flashcards, quizzes, and study guides from your notes, making learning more efficient and effective.

🔗 **[Try FlashLearn Now](https://flash-learn-seven.vercel.app/)**

## Features

### AI-Powered Learning
- Intelligent flashcard generation from your notes
- Smart quiz creation based on key concepts
- Automated study guide compilation
- Personalized learning recommendations

### Study Tools
- Interactive flashcard review system
- Progress tracking and analytics

## Technology Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: TailwindCSS
- **Database**: SQLite
- **Authentication**: Kinde
- **AI Integration**: OpenAI API
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager
- OpenAI API key

### Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/flashlearn.git
cd flashlearn
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Add your API keys and configuration to .env.local
```

4. Initialize the database
```bash
npm run db:setup
```

5. Start the development server
```bash
npm run dev
```

6. Visit `http://localhost:3000` in your browser
