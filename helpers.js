const fetch = require('node-fetch');

module.exports = {
  getCountryNameBySnapshot(snapshotItem) {
    switch (snapshotItem.country) {
      case 'S. Korea':
        return 'South Korea'
      case 'UK':
        return 'United Kingdom'
      case 'USA':
        return 'United States'
      default:
        return snapshotItem.country
    }
  },
  async fetchData() {
    const currentDataUrl = process.env.CURRENT_DATA_URL
    const result = await fetch(currentDataUrl)
    return result.json()
  }
}