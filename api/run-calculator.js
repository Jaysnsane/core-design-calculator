import { calculateSolarBatteryDesign } from './solarBatteryCalculator';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const results = calculateSolarBatteryDesign(req.body);

    return res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Calculator failed'
    });
  }
}
