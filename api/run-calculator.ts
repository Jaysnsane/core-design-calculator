import type { VercelRequest, VercelResponse } from '@vercel/node';
import { calculateSolarBatteryDesign } from '../src/solarBatteryCalculator';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const results = calculateSolarBatteryDesign(req.body);

    return res.status(200).json({
      success: true,
      calculatorVersion: 'pv-storage-v1',
      results,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Calculator failed',
    });
  }
}
