# 🚗 Car Scraper - Find Your Dream Second-Hand Car
LinkedIn Post: https://www.linkedin.com/posts/-anurag-sindhu_softwareengineering-automation-sideproject-activity-7314250433810612224-XINS?utm_source=share&utm_medium=member_desktop&rcm=ACoAABkN1nYBUonoPjJUX6ZGgKSHTAe1NDkPic4
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://www.javascript.com/)
[![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white)](https://slack.com)

An intelligent car scraper that monitors multiple platforms for second-hand cars and notifies you when your dream car becomes available or when prices drop. Never miss an opportunity to find your perfect car!

## 🌟 Features

- 🔍 **Multi-Platform Integration**
  - Spinny
  - Cars24
  - Ola Cars
  - CarDekho
  - *Easily extensible to more platforms*

- 🔔 **Smart Notifications**
  - Instant alerts for new car listings
  - Price drop notifications
  - Custom alerts for specific car IDs
  - Slack integration for real-time updates

- ⚙️ **Customizable Configuration**
  - Configurable time intervals
  - Year and price limits
  - Custom notification thresholds
  - Individual car criteria (price, kilometers)

## 🚀 Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)
- A Slack workspace (for notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/car_scrapper.git
   cd car_scrapper
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```
   SLACK_WEBHOOK_URL=your_slack_webhook_url
   SLACK_CHANNEL_ID=your_channel_id
   SLACK_USERNAME=Cars 24
   PORT=3015
   IS_DEVELOPMENT=true
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure car preferences**
   - Edit `default.json` to set your car preferences
   - Set `new_car_params_additional` for specific brands and models

5. **Start the application**
   ```bash
   node app.js
   ```

## ⚙️ Configuration Options

- **Time Settings**
  - Configure how often to check for updates
  - Set notification intervals

- **Car Criteria**
  - Year limits
  - Price ranges
  - Kilometer limits
  - Brand and model preferences

- **Notification Settings**
  - Number of consecutive notifications
  - Price drop thresholds
  - Individual car alerts

## 🔮 Future Enhancements

- [ ] Additional platform integrations
- [ ] Multiple notification channels
  - WhatsApp integration
  - SMS notifications
  - Email alerts
- [ ] Advanced filtering options
- [ ] User interface for configuration
- [ ] Price trend analysis
- [ ] Car value predictions

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Thanks to all the car platforms for their APIs
- The Node.js community for amazing tools and libraries
- All contributors who help improve this project
