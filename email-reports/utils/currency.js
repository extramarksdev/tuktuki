const FALLBACK_USD_TO_INR = 83.5;
const CACHE_DURATION = 3600000;

let cachedRate = null;
let cacheTimestamp = null;

export const getUsdToInrRate = async () => {
  if (
    cachedRate &&
    cacheTimestamp &&
    Date.now() - cacheTimestamp < CACHE_DURATION
  ) {
    console.log(`   💱 Using cached USD to INR rate: ${cachedRate}`);
    return cachedRate;
  }

  try {
    console.log(`   💱 Fetching live USD to INR rate...`);

    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates.INR;

    if (!rate || typeof rate !== "number") {
      throw new Error("Invalid rate received");
    }

    cachedRate = rate;
    cacheTimestamp = Date.now();

    console.log(`   ✅ Live USD to INR rate: ${rate}`);
    return rate;
  } catch (error) {
    console.warn(`   ⚠️  Failed to fetch live rate: ${error.message}`);
    console.log(`   ↩️  Using fallback rate: ${FALLBACK_USD_TO_INR}`);
    return FALLBACK_USD_TO_INR;
  }
};
