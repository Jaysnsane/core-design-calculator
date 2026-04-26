export function calculateSolarBatteryDesign(input) {
  // TEMP TEST VERSION

  const systemSize = Number(input.systemSizeKwDc || 0);
  const batteryQty = Number(input.batteryQty || 0);

  return {
    systemSize,
    batteryQty,
    message: "Calculator is working",
    timestamp: new Date().toISOString()
  };
}
