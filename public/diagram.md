graph TD
    A["👤 User Clicks CREATE PORTFOLIO Button"] -->|Input: name + broker| B["✔️ Validate Input<br/>portfolioName.trim() !== ''"]
    B -->|Valid| C["📤 POST /api/portfolios<br/>fetch with name & brokerId"]
    B -->|Invalid| B2["⚠️ Button Does Nothing<br/>No API call"]
    
    C -->|API Call| D["🔐 Backend: Check Session<br/>getServerSession()"]
    D -->|Unauthorized| E["❌ Error 401<br/>User not logged in"]
    D -->|Authorized| F["🔍 Validate name field<br/>if !name: error 400"]
    
    F -->|Missing| G["❌ Error 400<br/>Name required"]
    F -->|Present| H["🔎 Check Duplicate<br/>Query: name + userId"]
    
    H -->|Name exists| I["❌ Error 409<br/>Portfolio already exists"]
    H -->|Name unique| J["💾 INSERT INTO portfolios table<br/>Generates ID, timestamps"]
    
    J -->|Success| K["✅ Return 201 + Portfolio JSON"]
    K -->|Response received| L["🔄 Frontend: Update State<br/>setPortfolioNames"]
    L -->|Next| M["🎯 Set Selected Portfolio<br/>setSelectedPortfolio"]
    M -->|Next| N["❌ Close Modal<br/>setShowPortfolioModal false"]
    N -->|Next| O["📑 Switch Tab<br/>setActiveTab='assets'"]
    O -->|Finally| P["✨ UI Update Complete<br/>Assets tab now active"]
    
    E -->|Display Error| Q["⚠️ Modal stays open<br/>Show error message"]
    G -->|Display Error| Q
    I -->|Display Error| Q
    
    P --> R["👤 Next: User adds assets<br/>to the portfolio"]
    
    style A fill:#4da6ff
    style K fill:#66b366
    style E fill:#ff6666
    style G fill:#ff6666
    style I fill:#ff6666
    style P fill:#ffcc00
    style R fill:#99ccff