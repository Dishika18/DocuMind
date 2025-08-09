# 📄 DocuMind – AI Powered Document Analysis

![DocuMind Screenshot](/public/og-image.png)

DocuMind is an AI-powered document analysis tool that lets you upload or fetch web documents, extract key content, and chat with an AI assistant that answers questions with 100% accuracy based on the provided content.  

Perfect for quickly understanding large docs, technical articles, or code snippets.

---

## ✨ Features
- 📂 **Document Upload & URL Fetching** – Upload local files or provide a web URL.
- 🧠 **AI-Powered Q&A** – Ask questions and get answers strictly based on the document content.
- 📝 **Structured Content Extraction** – Extracts headings, sections, and code blocks.
- 💡 **Context-Aware Insights** – Includes step-by-step instructions or code examples when relevant.
- 🎨 **Modern UI** – Built with Tailwind CSS + Shadcn UI for a sleek look.

---

## 🛠 Tech Stack
- **Framework:** Next.js  
- **Styling:** Tailwind CSS + Shadcn UI  
- **AI Models:** Groq + Google Generative AI  
- **Scraping & Parsing:** Cheerio  
- **Code Highlighting:** react-syntax-highlighter  

---

## 📦 Installation

### 1️. Clone the Repository
```bash
git clone https://github.com/yourusername/documind.git
cd documind
```

### 2️. Install Dependencies
```bash
npm install
```

### 3️. Set Up Environment Variables
Create a .env.local file in the root of your project and add:

```bash
GROQ_API_KEY=your_groq_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
```

### 4️. Run the Development Server
```bash
npm run dev
```

Your app will be live at:
http://localhost:3000

--- 

### Thanks for checking out DocuMind!


Built with ❤️ by [Dishika Vaishkiyar](https://github.com/Dishika18)
