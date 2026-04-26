const BREAKER_SIZES = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 125, 150];
const VLLD_SIZES = [30, 60, 100, 200];

function toNumber(value) {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : 0;
}

function isBlank(value) {
  return value === undefined || value === null || value === '';
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function nextStandardSize(value, sizes) {
  if (value <= 0) return '';
  return sizes.find((size) => value <= size) ?? '';
}

function getVlldType(method) {
  if (method === 'Load Side Breaker') return 'NON-FUSIBLE, NEMA 3R';
  if (method === 'Load Side Tap' || method === 'Supply Side Tap') return 'FUSIBLE, NEMA 3R';
  return '';
}

export function calculateSolarBatteryDesign(input) {
  const systemSizeKwDc = toNumber(input.systemSizeKwDc);
  const moduleWattage = toNumber(input.moduleWattage);
  const inverterBrand = input.inverterBrand ?? '';
  const batteryModel = input.batteryModel ?? '';
  const batteryQtyRaw = input.batteryQty ?? '';
  const batteryQty = toNumber(batteryQtyRaw);

  const moduleQty =
    systemSizeKwDc > 0 && moduleWattage > 0
      ? round2((systemSizeKwDc * 1000) / moduleWattage)
      : '';

  let qtyInverters = '';
  if (inverterBrand === 'Enphase') qtyInverters = toNumber(moduleQty);
  if (inverterBrand === 'Tesla') qtyInverters = systemSizeKwDc <= 20 ? 1 : systemSizeKwDc >= 20.01 ? 2 : '';

  const controllerModel =
    batteryModel === 'Enphase 5P'
      ? 'Enphase System Controller 3'
      : batteryModel === 'Tesla Powerwall 3'
      ? 'Tesla Gateway 3'
      : '';

  const backupPanelMainBreakerSize =
    input.backupType === 'Whole Home Back-Up'
      ? input.mainBreakerExisting ?? ''
      : input.backupType === 'Partial Home Back-Up'
      ? 100
      : '';

  const backupPanelBusRating =
    input.backupType === 'Whole Home Back-Up'
      ? input.busRatingExisting ?? ''
      : input.backupType === 'Partial Home Back-Up'
      ? 100
      : '';

  const solarContinuousCurrent =
    inverterBrand === 'Enphase'
      ? round2(toNumber(qtyInverters) * 1.21)
      : inverterBrand === 'Tesla'
      ? 0
      : '';

  const solarMaxCurrent = isBlank(solarContinuousCurrent)
    ? ''
    : round2(toNumber(solarContinuousCurrent) * 1.25);

  const batteryContinuousCurrent =
    batteryModel === 'Enphase 5P'
      ? round2(batteryQty * 16)
      : batteryModel === 'Tesla Powerwall 3'
      ? round2(batteryQty * 47.92)
      : '';

  const batteryMaxCurrent = isBlank(batteryContinuousCurrent)
    ? ''
    : round2(toNumber(batteryContinuousCurrent) * 1.25);

  const hasBatteryQty = !isBlank(batteryQtyRaw);

  const combinedContinuousCurrent = hasBatteryQty
    ? round2(
        toNumber(solarContinuousCurrent) +
          toNumber(batteryContinuousCurrent) +
          toNumber(input.existingInverterContinuousCurrent)
      )
    : '';

  const combinedMaxCurrent = hasBatteryQty
    ? round2(
        toNumber(solarMaxCurrent) +
          toNumber(batteryMaxCurrent) +
          toNumber(input.existingInverterMaxCurrent)
      )
    : '';

  const isMspUpgrade = input.mspUpgrade === 'Yes';
  const isFullServiceUpgrade = input.fullServiceUpgrade === 'Yes';

  return {
    calculatorVersion: 'pv_storage_v1',
    moduleQty,
    qtyInverters,
    controllerModel,
    backupPanelMainBreakerSize,
    backupPanelBusRating,
    solar: {
      type: inverterBrand === 'Enphase' ? 'Enphase' : inverterBrand === 'Tesla' ? 'Tesla' : '',
      continuousCurrent: solarContinuousCurrent,
      maxCurrent: solarMaxCurrent,
      breakerFuseSize: nextStandardSize(toNumber(solarMaxCurrent), BREAKER_SIZES),
      vlldSize: nextStandardSize(toNumber(solarMaxCurrent), VLLD_SIZES),
      vlldType: getVlldType(input.solarMethod)
    },
    battery: {
      type: batteryModel === 'Enphase 5P' ? 'Enphase 5P' : batteryModel === 'Tesla Powerwall 3' ? 'Tesla Powerwall 3' : '',
      quantity: isBlank(batteryQtyRaw) ? '' : batteryQtyRaw,
      continuousCurrent: batteryContinuousCurrent,
      maxCurrent: batteryMaxCurrent,
      breakerFuseSize: nextStandardSize(toNumber(batteryMaxCurrent), BREAKER_SIZES),
      vlldSize: nextStandardSize(toNumber(batteryMaxCurrent), VLLD_SIZES),
      vlldType: getVlldType(input.batteryMethod)
    },
    combined: {
      continuousCurrent: combinedContinuousCurrent,
      maxCurrent: combinedMaxCurrent,
      breakerFuseSize: nextStandardSize(toNumber(combinedMaxCurrent), BREAKER_SIZES),
      generationVlldRating: nextStandardSize(toNumber(combinedMaxCurrent), VLLD_SIZES),
      vlldType: getVlldType(input.controllerMethod)
    },
    adders: {
      battery: batteryModel ? `${batteryModel} ${input.includesStorage === 'Yes' ? batteryQtyRaw : ''}`.trim() : '',
      mainBreakerRating: isMspUpgrade ? input.mspMainNew ?? '' : isFullServiceUpgrade ? 200 : '',
      busRating: isMspUpgrade ? input.mspBusNew ?? '' : isFullServiceUpgrade ? 225 : ''
    }
  };
}
