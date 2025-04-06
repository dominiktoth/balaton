# NextAuth Supabase App

This project is a Next.js application that implements authentication using NextAuth and Supabase. It provides a simple way to manage user authentication and session management.

## Features

- User authentication with NextAuth
- Supabase as the backend for user management
- Custom authentication button component
- Global styles for the application

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd nextauth-supabase-app
   ```

3. Install the dependencies:

   ```
   npm install
   ```

   or

   ```
   yarn install
   ```

### Configuration

1. Create a `.env.local` file in the root of the project and add your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

2. Set up your Supabase project and configure authentication settings as needed.

### Running the Application

To start the development server, run:

```
npm run dev
```

or

```
yarn dev
```

Open your browser and navigate to `http://localhost:3000` to see the application in action.

### Usage

- Use the `AuthButton` component to allow users to sign in or sign out.
- The application will manage user sessions automatically using NextAuth.

### License

This project is licensed under the MIT License. See the LICENSE file for more details.