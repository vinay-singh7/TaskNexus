# 🚀 TaskNexus

**TaskNexus** is a blazing fast, all-in-one local productivity suite designed to replace dozens of scattered web apps. It features 21 integrated tools ranging from developer utilities and code editors to financial calculators, all running instantly in your browser with zero server-side processing for maximum privacy.

## ✨ Features

*   **⚡️ Lightning Fast & Local**: All tools run entirely in your browser using client-side JavaScript. No data is sent to external servers unless explicitly shared.
*   **🎨 Glassmorphism UI**: A gorgeous, modern aesthetic utilizing a cohesive design system with custom CSS variables, smooth animations, and vibrant background glows.
*   **🛠 21 Built-In Tools**:
    *   **Developer Tools**: Online Code Editor (powered by Monaco/VS Code engine), JSON/JWT Tester, Regex Tester, Base64 Encoders.
    *   **Financial Calculators**: EMI, Simple & Compound Interest, Return on Investment (ROI).
    *   **PDF Utilities**: Merge, extract, and convert images to PDF completely offline.
    *   **Productivity**: Kanban To-Do list, Notes, Pomodoro Timer, and Reminders.
    *   **Utility & Media**: Unit Converter, QR Code Generator/Scanner (with camera support), Image format converter.
*   **🔒 Authentication**: Secure user login and session management powered by Clerk.

## 🛠 Tech Stack

*   **Frontend**: HTML5, Vanilla JavaScript, Custom CSS.
*   **Architecture**: Modular Single Page Application (SPA) using Hash Routing.
*   **Dependencies** (loaded via CDN/local vendor):
    *   [Clerk](https://clerk.com/) (Authentication)
    *   [Monaco Editor](https://microsoft.github.io/monaco-editor/) (Code Editor)
    *   [pdf-lib](https://pdf-lib.js.org/) (Client-side PDF manipulation)
    *   [jsQR](https://github.com/cozmo/jsQR) (QR Code scanning)
    *   [SortableJS](https://sortablejs.github.io/Sortable/) (Drag and Drop Kanban)

## 🚀 Getting Started

### Prerequisites
*   A modern web browser (Chrome, Firefox, Safari, Edge).
*   Python 3 (to run the local development server).
*   A [Clerk](https://clerk.com/) account for authentication.

### Installation

1.  **Clone the repository**
    \`\`\`bash
    git clone https://github.com/yourusername/TaskNexus.git
    cd TaskNexus
    \`\`\`

2.  **Configure Environment Variables**
    *   Copy the example configuration file:
        \`\`\`bash
        cp config.example.js config.js
        \`\`\`
    *   Open \`config.js\` and add your Clerk Publishable Key:
        \`\`\`javascript
        window.ENV = {
          CLERK_PUBLISHABLE_KEY: 'pk_test_...',
          CLERK_JS_URL: 'https://...'
        };
        \`\`\`

3.  **Run the local server**
    Start the custom Python server to serve the app and proxy requests if needed:
    \`\`\`bash
    python3 start.py
    \`\`\`
    *The app will automatically open in your default browser at \`http://localhost:8765\`.*

## 🔒 Security & Privacy Note

TaskNexus is designed with privacy in mind. Because the core tools execute in the browser:
*   Your passwords, notes, and code snippets remain on your device (stored in \`localStorage\`).
*   File uploads (like in the QR file share) are only proxied through external services when explicitly requested.
*   **Never commit your \`config.js\` file.** It has been safely added to \`.gitignore\`.

## 🤝 Contributing

Contributions are welcome! If you have an idea for a new tool or want to improve the UI, feel free to open a pull request.

1.  Fork the Project
2.  Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3.  Commit your Changes (\`git commit -m 'Add some AmazingFeature'\`)
4.  Push to the Branch (\`git push origin feature/AmazingFeature\`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License.
