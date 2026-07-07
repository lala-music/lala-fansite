const GAS_URL = 'https://script.google.com/macros/s/AKfycbz5_hLiUKG65eSWuH5IvvdswsRYxkI_g722-GKakdA6ntBRt5hv4z6eDvDipWl2RA_Y/exec';

async function testFetch() {
    try {
        const response = await fetch(GAS_URL + '?t=' + Date.now());
        const data = await response.json();
        console.log("GAS GET Response:", data);
        
        if (data.events && data.events.length > 0) {
            console.log("Events array exists. Count:", data.events.length);
        } else {
            console.log("Events array is empty.");
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testFetch();
