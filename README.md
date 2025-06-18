# Chat Yatri | Powered by Yatri Cloud

Chat Yatri is an advanced AI-powered chat interface developed by Yatri Cloud. It provides natural, context-aware conversations with lightning-fast responses and enterprise-grade security.

## Features

- **Professional Workflow**: Dedicated API setup page for seamless onboarding
- **Natural Conversations**: Engage in fluid, context-aware conversations with advanced AI
- **Lightning Fast**: Get instant responses powered by cutting-edge technology
- **Secure & Private**: Your conversations are protected with enterprise-grade security
- **OpenRoute Integration**: Connect to multiple AI models through OpenRouter's unified API

## User Experience

### First-Time Setup
1. **Welcome Page**: Users are greeted with a professional API setup interface
2. **Step-by-Step Guide**: Clear instructions for getting started with OpenRouter
3. **Model Selection**: Browse and filter hundreds of AI models by category
4. **Smart Configuration**: Intelligent defaults for optimal performance

### Chat Interface
1. **Clean Design**: Modern, distraction-free chat environment
2. **Conversation Management**: Organize and manage multiple conversations
3. **Real-time Streaming**: See AI responses as they're generated
4. **Settings Access**: Easy access to API configuration and preferences

## Benefits

- **User-Friendly Interface**: Intuitive design with clear navigation
- **High Availability**: Always available to assist you
- **Customizable**: Tailor the chat experience to your needs
- **Multi-Model Support**: Access to various AI models including Google Gemini, OpenAI GPT, Anthropic Claude, and more
- **Professional Onboarding**: Smooth setup process for new users

## OpenRoute API Integration

Chat Yatri now supports OpenRoute API integration, allowing you to use various AI models through a single interface.

### Supported Models

- **Google**: Gemini 2.0 Flash
- **OpenAI**: GPT-4o, GPT-4o Mini
- **Anthropic**: Claude 3.5 Sonnet
- **Meta**: Llama 3.1 8B/70B Instruct
- **Mistral**: Mistral 7B Instruct
- **Microsoft**: WizardLM 2 8x22B

### Setup Instructions

1. **Get OpenRoute API Key**: Visit [OpenRouter](https://openrouter.ai/keys) to get your API key.

2. **Configure in App**: 
   - Open the application
   - Enter your OpenRoute API key
   - Select your preferred AI model
   - Optionally add your site URL and name for rankings
   - Click "Start Conversation"

3. **Start Chatting**: Once configured, you can start chatting with your chosen AI model.

### Features

- **Streaming Responses**: Real-time streaming of AI responses
- **Conversation History**: Maintains context across conversations
- **Model Switching**: Change models without losing conversation history
- **Secure Storage**: API keys are stored locally in your browser
- **Credit Management**: Configurable max tokens limit to manage credit usage
- **Smart Token Limits**: Intelligent default token limits based on model pricing and context
- **Model Categorization**: Filter models by category (Programming, Roleplay, Marketing, etc.)
- **Real-time Usage Tracking**: Monitor token usage and estimated costs
- **Model Information**: Detailed model info including pricing tier, context length, and smart defaults

### Configuration Options

- **API Key**: Your OpenRouter API key (required)
- **Model**: Choose from hundreds of available AI models with smart categorization
- **Site URL**: Optional URL for OpenRouter rankings
- **Site Name**: Optional site name for OpenRouter rankings
- **Max Tokens**: Maximum number of tokens to generate (1-100,000, with smart defaults)

### Smart Token Management

The application now includes intelligent token management based on model characteristics from [OpenRouter](https://openrouter.ai/models):

- **Free Models**: Up to 8,000 tokens (generous limits)
- **Low-Cost Models**: Up to 6,000 tokens (Llama 3.1 8B, etc.)
- **Medium-Cost Models**: Up to 5,000 tokens (GPT-3.5 Turbo, etc.)
- **High-Cost Models**: Up to 4,000 tokens (GPT-4o, etc.)
- **Premium Models**: Up to 3,000 tokens (GPT-4, etc.)
- **Ultra-Premium Models**: Up to 2,000 tokens (o1-pro, etc.)

**Note**: Smart defaults are calculated based on model pricing and context length. You can always adjust the token limit manually. If you encounter a 402 error (insufficient credits), try reducing the max tokens value or add more credits to your OpenRouter account.

## Setup Instructions

### Prerequisites

1. **Ubuntu**: Ensure your system is up to date and install npm.
**Copy and execute SSH command**

    ```sh
    ssh -i ~/.ssh/id_rsa.pem username@ipaddress
    sudo apt update && sudo apt upgrade -y
    sudo apt install npm
    ```

2. **Ollama**: Install Ollama using snap.
    ```sh
    sudo snap install ollama
    ```

3. **Project Directory**: Navigate to the project directory and install dependencies.
    ```sh
    npm install
    node server/index.js
    npm run dev
    ```

### Running the Project

1. **Server**: Ensure the server is running on port 3000.
2. **Frontend**: Ensure the frontend is running on port 5173.
3. **Ollama**: Ensure Ollama is running on port 11434.

### Nginx Custom Domain Setup

1. **Install Nginx**:
    ```sh
    sudo apt install -y nginx
    ```

2. **Configure Nginx**:
    ```sh
    sudo nano /etc/nginx/sites-available/chatgpt.yatricloud.com
    ```

3. **Install Certbot**:
    ```sh
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d chatgpt.yatricloud.com
    ```

4. **Nginx Configuration**:
    ```nginx
    server {
        listen 443 ssl;
        server_name chat.yatricloud.com;

        location / {
            proxy_pass http://localhost:5173;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/ {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            
            # SSE specific configurations
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
            proxy_buffering off;
            proxy_cache off;
            chunked_transfer_encoding off;
        }

        ssl_certificate /etc/letsencrypt/live/chat.yatricloud.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/chat.yatricloud.com/privkey.pem;
        include /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    }

    server {
        listen 80;
        server_name chat.yatricloud.com;
        
        location / {
            return 301 https://$server_name$request_uri;
        }
    }
    ```

5. **Test Nginx Configuration**:
    ```sh
    sudo nginx -t
    ```

6. **Restart Nginx**:
    ```sh
    sudo systemctl restart nginx
    ```

## Additional Documentation

- [Ubuntu Setup](docs/ubuntu.md)
- [Ollama Setup](docs/ollama.md)
- [Nginx Setup](docs/nginx.md)
- [Connecting DeepSeek Ollama with the UI](docs/connect-ollama-ui.md)
- [Contributing](CONTRIBUTING.md)
  
### **Our Website:** [**Visit us**](https://yatricloud.com)


### **Like, Share & Subscribe Now**

* **Joining takes one minute and is beneficial for your career:** [**Subscribe Now**](https://www.youtube.com/@yatricloud?sub_confirmation=1)

* **Yatri Blog:** [**Read Now**](https://blog.yatricloud.com)
    
* **Let's build a community together:** [**Visit us**](https://linktr.ee/yatricloud)

### **Follow our Creators**

* [**Yatharth Chauhan on LinkedIn**](https://www.linkedin.com/in/yatharth-chauhan/)
    
* [**Nensi Ravaliya on LinkedIn**](https://www.linkedin.com/in/nencyravaliya28/)

### **Join Our Exclusive Community**

* **Telegram Community:** [**Join Now**](https://t.me/yatricloud)
    
* **WhatsApp Community:** [**Join Now**](https://chat.whatsapp.com/IkZeL8QnqzM1Scagxq5whu)

### **Follow us on Social Media**

* **Twitter:** [**Follow Now**](https://x.com/yatricloud)
    
* **Instagram:** [**Follow Now**](https://www.instagram.com/yatricloud)
    
* **WhatsApp Channel:** [**Follow Now**](https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s)

