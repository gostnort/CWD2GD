document.addEventListener('DOMContentLoaded', function() {
    const cwdInput = document.getElementById('cwdInput');
    const gdOutput = document.getElementById('gdOutput');
    const flightDeckCrew = document.getElementById('flightDeckCrew');
    const stwCount = document.getElementById('stwCount');
    const totalCrew = document.getElementById('totalCrew');
    const aircraftType = document.getElementById('aircraftType');
    const convertBtn = document.getElementById('convertBtn');
    const copyBtn = document.getElementById('copyBtn');

    // Initialize without default values
    stwCount.value = '';
    totalCrew.value = '';
    
    // Check screen size on load and adjust text area fonts if needed
    checkScreenSize();
    
    // Monitor window resize to adjust font size dynamically
    window.addEventListener('resize', checkScreenSize);
    
    function checkScreenSize() {
        // Font size is handled by CSS media queries
        // This function can be extended for additional dynamic adjustments if needed
        console.log(`Current window width: ${window.innerWidth}px`);
    }

    // Link flight deck crew and steward counts to keep total consistent
    flightDeckCrew.addEventListener('input', function() {
        updateLinkedCounts(parseInt(flightDeckCrew.value), 'flightDeck');
    });

    stwCount.addEventListener('input', function() {
        updateLinkedCounts(parseInt(stwCount.value), 'steward');
    });

    // Adding event listener for the convert button
    convertBtn.addEventListener('click', function() {
        processCWD();
    });

    // Handle clipboard paste directly into the input textarea
    cwdInput.addEventListener('paste', function() {
        // Auto-detect parameters based on pasted content
        setTimeout(() => {
            detectTotalCrew();
            autoDetectParams();
        }, 100);
    });

    // Add keyup event to detect changes in the input content
    cwdInput.addEventListener('keyup', function() {
        detectTotalCrew();
        autoDetectParams();
    });

    // Add event listener for copy button
    copyBtn.addEventListener('click', function() {
        copyToClipboard();
    });

    // Function to detect total crew count from CWD
    function detectTotalCrew() {
        const text = cwdInput.value;
        if (!text) {
            totalCrew.value = '';
            return 0;
        }
        
        try {
            // Look for the "CREW NUMBER:X" pattern
            const crewNumberMatch = text.match(/CREW\s+NUMBER:?\s*(\d+)/i);
            if (crewNumberMatch && crewNumberMatch[1]) {
                const detectedTotal = parseInt(crewNumberMatch[1]);
                if (detectedTotal > 0) {
                    totalCrew.value = detectedTotal;
                    return detectedTotal;
                }
            }
            
            // If crew number not found in header, count crew entries
            const lines = text.trim().split('\n');
            
            // Count crew entries by looking for lines that start with a number followed by a dot
            const crewCount = lines.filter(line => {
                const trimmed = line.trim();
                return trimmed && /^\s*\d+\./.test(trimmed);
            }).length;
            
            if (crewCount > 0) {
                totalCrew.value = crewCount;
                return crewCount;
            }
        } catch (e) {
            console.error("Error detecting total crew:", e);
        }
        
        // No valid total found
        totalCrew.value = '';
        return 0;
    }

    // Function to update linked counts to maintain total
    function updateLinkedCounts(value, source) {
        const totalValue = parseInt(totalCrew.value) || 0;
        if (totalValue === 0) return; // Don't adjust if no total detected
        
        if (source === 'flightDeck') {
            // When flight deck crew changes, adjust steward count
            // Flight deck has priority - stewards are adjusted to maintain total
            const newStwCount = Math.max(0, totalValue - value);
            stwCount.value = newStwCount;
        } else if (source === 'steward') {
            // When steward count changes, flight deck crew remains unchanged
            // Any remaining crew will be marked as DHC
            // No need to adjust flight deck crew
            
            // Validate that the sum doesn't exceed total
            const flightDeckValue = parseInt(flightDeckCrew.value) || 0;
            if (value + flightDeckValue > totalValue) {
                // If the sum exceeds total, adjust stewards down
                stwCount.value = Math.max(0, totalValue - flightDeckValue);
            }
        }
    }

    // Function to auto-detect parameters based on content
    function autoDetectParams() {
        const totalCrewValue = parseInt(totalCrew.value) || 0;
        if (totalCrewValue === 0) {
            // Reset values if no total detected
            stwCount.value = '';
            return;
        }
        
        try {
            // Default assumption: About 20% flight deck, rest cabin crew
            const estimatedFlightDeckCrew = Math.max(2, Math.round(totalCrewValue * 0.2));
            const estimatedStwCount = totalCrewValue - estimatedFlightDeckCrew;
            
            // Only set if the fields are empty or if total crew was just detected
            if (!flightDeckCrew.value) {
                flightDeckCrew.value = estimatedFlightDeckCrew;
            }
            if (!stwCount.value) {
                stwCount.value = estimatedStwCount;
            }
        } catch (e) {
            console.error("Error auto-detecting parameters:", e);
        }
    }

    function processCWD() {
        const cwd_text = cwdInput.value;
        const flight_deck_crew = parseInt(flightDeckCrew.value) || 0;
        const stw_count = parseInt(stwCount.value) || 0;
        const aircraft = aircraftType.value.trim() || "B____";
        const total = parseInt(totalCrew.value) || 0;

        if (!cwd_text) {
            alert("Please paste CWD content first!");
            return;
        }

        if (!totalCrew.value) {
            alert("Could not detect total crew count. Please check the CWD input format.");
            return;
        }

        // Calculate captains and first officers based on flight deck crew
        // If odd number, first officers get the extra one
        const capt_count = Math.floor(flight_deck_crew / 2);
        const fo_count = flight_deck_crew - capt_count;
        
        // Calculate DHC count
        const dhc_count = Math.max(0, total - flight_deck_crew - stw_count);
        
        // Display summary in console for debugging
        console.log(`Crew Distribution: 
        - Total: ${total}
        - Flight Deck: ${flight_deck_crew} (${capt_count} CAPT + ${fo_count} FO)
        - Stewards: ${stw_count}
        - DHC: ${dhc_count}`);

        // Process the CWD text and convert it to GD format
        const gdText = convertCwdToGd(cwd_text, capt_count, fo_count, stw_count, aircraft, dhc_count);
        gdOutput.value = gdText;
    }

    function copyToClipboard() {
        if (!gdOutput.value) {
            alert("No content to copy!");
            return;
        }
        
        gdOutput.select();
        document.execCommand('copy');
        
        // Visual feedback for copy action
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        copyBtn.style.backgroundColor = "#45a049";
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = "#2196F3";
        }, 1500);
    }

    function convertCwdToGd(cwd_text, capt_count, fo_count, stw_count, aircraft, dhc_count) {
        // Split input text into lines
        const lines = cwd_text.trim().split('\n');
        
        // Extract header information
        const header = lines[0].trim().split(/\s+/);
        const tmp_list = header[0].split('/');
        
        // Parse flight number and date
        const flightNum = tmp_list[0].substring(4); // Remove 'CWD:' prefix
        const dateObj = parseDate(tmp_list[1], 'birth');
        const flightDate = dateObj.getFullYear() + '/' + 
                           padZero(dateObj.getMonth() + 1) + '/' + 
                           padZero(dateObj.getDate());
        
        // Format flight info line
        const flightInfo = `${flightNum}/${flightDate} ${aircraft} ${header[1]}--${header[2]}`;
        
        // Process crew list
        const crew_list = [];
        for (let i = 3; i < lines.length; i++) {  // Skip header lines
            const line = lines[i].trim();
            if (!line || !line.match(/^\s*\d+\./)) continue; // Skip non-crew lines
            
            try {
                // Extract the number part (up to the dot)
                const numberMatch = line.match(/^\s*(\d+)\./);
                if (!numberMatch) continue;
                
                // Get index where the name starts (after number and dot)
                const nameStartIndex = line.indexOf('.') + 1;
                
                // Extract name part (exactly 28 chars) - can include slashes
                const namePart = line.substring(nameStartIndex, nameStartIndex + 28).trim();
                
                // Get rest of the line after the name part
                const rest = line.substring(nameStartIndex + 28).trim().split(/\s+/);
                
                if (rest.length < 5) continue; // Skip invalid lines
                
                // Extract crew member information
                const name = namePart.replace('/', ' ');
                const gender = rest[3]; // Position adjusted based on format
                const nationality = rest[2]; // Position adjusted
                const birth = parseDate(rest[4], 'birth');
                const birthFormatted = birth.getFullYear() + '/' + 
                                      padZero(birth.getMonth() + 1) + '/' + 
                                      padZero(birth.getDate());
                const passport = rest[5];
                const expiry = parseDate(rest[6], 'expiry');
                const expiryFormatted = expiry.getFullYear() + '/' + 
                                       padZero(expiry.getMonth() + 1) + '/' + 
                                       padZero(expiry.getDate());
                
                crew_list.push({ 
                    name, 
                    gender, 
                    birth: birthFormatted, 
                    passport, 
                    expiry: expiryFormatted, 
                    nationality 
                });
            } catch (e) {
                console.error("Error parsing crew member:", e, line);
            }
        }
        
        // Generate GD text - with an empty line at the beginning
        let gd_text = `\nCREW LIST\n${flightInfo}`;
        
        const total_crew = crew_list.length;
        
        crew_list.forEach((crew, i) => {
            let title;
            if (i < capt_count) {
                title = "CAPT";
            } else if (i < capt_count + fo_count) {
                title = "FO  ";
            } else if (i < capt_count + fo_count + stw_count) {
                title = "STW ";
            } else {
                title = "DHC ";
            }
            
            // Format name to exactly 28 characters
            const formattedName = (crew.name + ' '.repeat(28)).substring(0, 28);
            
            gd_text += `\n${title} ${formattedName} ${crew.gender} ${crew.birth} ${crew.passport} ${crew.expiry} ${crew.nationality}`;
        });
        
        // Add total count line
        gd_text += `\nTTL:${capt_count + fo_count}/${stw_count}`;
        if (dhc_count > 0) {
            gd_text += `/${dhc_count}`;
        }
        
        return gd_text;
    }
    
    // Helper functions
    function parseDate(dateStr, dateType) {
        try {
            // Clean up input
            dateStr = dateStr.trim().toUpperCase();
            const currentYear = new Date().getFullYear();
            const currentYearSuffix = currentYear % 100; // Last two digits
            
            if (dateType === 'birth') {
                // Birth date format: DDMMMYY (e.g., 26APR86)
                
                // Extract day
                const day = dateStr.substring(0, 2).replace(/\D/g, '').padStart(2, '0');
                
                // Extract month (3 letters in the middle)
                let month = '';
                for (let i = 0; i < dateStr.length; i++) {
                    if (dateStr[i].match(/[A-Z]/i)) {
                        month = dateStr.substring(i, i+3);
                        if (month.length === 3) break;
                    }
                }
                
                // Extract year (last 2 digits)
                const yearMatch = dateStr.match(/(\d{2})$/);
                if (!yearMatch) return new Date(); // Return current date if no year found
                
                const yearSuffix = parseInt(yearMatch[1]);
                
                // Determine century - for birth dates:
                // If year suffix > current year suffix, it's from previous century
                // Example: If current year is 2024, then '86' would be 1986, not 2086
                const fullYear = (yearSuffix > currentYearSuffix) ? 
                                1900 + yearSuffix : 
                                2000 + yearSuffix;
                
                return new Date(fullYear, getMonthNumber(month) - 1, parseInt(day) || 1);
                
            } else if (dateType === 'expiry') {
                // Expiry date format: YYMMDD (e.g., 290509)
                
                // Try to extract components with regex first
                const dateMatch = dateStr.match(/(\d{2})(\d{2})(\d{2})/);
                
                if (dateMatch) {
                    const yearSuffix = parseInt(dateMatch[1]);
                    const month = parseInt(dateMatch[2]);
                    const day = parseInt(dateMatch[3]);
                    
                    // For expiry dates, they should be in the future
                    // If adding 2000 makes it in the past, use 2100 instead
                    let fullYear = 2000 + yearSuffix;
                    const testDate = new Date(fullYear, month - 1, day);
                    
                    if (testDate < new Date()) {
                        // If date is in the past with 20xx, try with 21xx
                        fullYear = 2100 + yearSuffix;
                    }
                    
                    return new Date(fullYear, month - 1, day);
                } else {
                    // Fallback to simple substring method
                    const yearSuffix = parseInt(dateStr.substring(0, 2) || '0');
                    const month = parseInt(dateStr.substring(2, 4) || '1');
                    const day = parseInt(dateStr.substring(4, 6) || '1');
                    
                    // Same logic as above
                    let fullYear = 2000 + yearSuffix;
                    const testDate = new Date(fullYear, month - 1, day);
                    
                    if (testDate < new Date()) {
                        fullYear = 2100 + yearSuffix;
                    }
                    
                    return new Date(fullYear, month - 1, day);
                }
            }
            
            // Default fallback - should never reach here if dateType is specified
            return new Date();
            
        } catch (e) {
            console.error(`Error parsing ${dateType} date:`, e, dateStr);
            return new Date(); // Return current date as fallback
        }
    }
    
    function getMonthNumber(monthStr) {
        const months = {
            'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
            'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
        };
        return months[monthStr] || 1; // Default to January if invalid
    }
    
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
}); 