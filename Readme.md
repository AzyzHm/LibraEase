# LibraEase

LibraEase is a comprehensive library management system built with React, TypeScript, and Vite on the frontend, and Node.js, Express, and MongoDB on the backend. This project aims to provide a seamless experience for managing library resources, including books, users, and loan records.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- User authentication and authorization
- Book catalog management
- Loan record management
- Profile management
- Responsive design

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Frontend

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/LibraEase.git
    cd LibraEase/Library-app
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Start the development server:
    ```sh
    npm run dev
    ```

### Backend

1. Navigate to the backend directory:
    ```sh
    cd ../Server
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the [Server](http://_vscodecontentref_/0) directory and add your MongoDB connection string:
    ```env
    MONGO_USERNAME=yourusername
    MONGO_PASSWORD=yourpassword

    EMAIL_USER=your email
    EMAIL_PASS=your email apppassword

    SERVER_PORT=8000
    ```

4. Start the development server:
    ```sh
    npm run dev
    ```

## Usage

1. Open your browser and navigate to `http://localhost:3000` to access the frontend.
2. The backend server will be running on `http://localhost:8000`.

## Project Structure

### Frontend
\```
Library-app/
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── public/
├── README.md
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── assets/
│   ├── components/
│   │   ├── index.ts
│   │   ├── Modal/
│   ├── features/
│   ├── index.css
│   ├── main.tsx
│   ├── models/
│   ├── pages/
│   ├── redux/
│   ├── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── LICENSE
└── Readme.md
\```


### Backend
\```
Server/
├── .env
├── .gitignore
├── package.json
├── src/
│   ├── config/
│   ├── controllers/
│   ├── daos/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── server.ts
│   ├── services/
│   └── utils/
├── tsconfig.json
\```


## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](http://_vscodecontentref_/1) file for details.

## Acknowledgements

This project is based on a tutorial by **Unknown Koder** on YouTube. Special thanks to him for the guidance and inspiration.
