# CWD to GD Converter

A simple web application to convert Crew Data (CWD) format to General Declaration (GD) format.

## Usage

1. Open `index.html` in any modern web browser
2. Paste your CWD content into the left text area
3. The application will automatically detect the total crew count from the CWD content
4. Flight deck crew and steward counts will be set based on the detected total
5. You can adjust the crew distribution as needed, and the values will remain linked to match the total
6. Enter the aircraft type (defaults to B____)
7. Click the "Convert" button
8. The converted GD format will appear in the right text area
9. Click "Copy to Clipboard" to copy the converted text

## Features

- Simple and clean interface
- Automatic detection of total crew count directly from CWD content
- Intelligent date parsing for both birth dates and expiration dates
- Improved name parsing to properly handle names with spaces and slashes
- Linked crew number inputs that maintain the correct total
- Automatically handles Deadhead Crew (DHC) assignment
- Customizable aircraft type
- Precisely formatted name fields (exactly 28 characters with proper spacing)
- Required empty line at the beginning of GD output format
- Clipboard integration for easy copying
- Responsive design with optimized layouts for:
  - Desktop screens (1280px+)
  - Medium screens (768px-1279px)
  - Mobile devices (below 768px)
  - Very small screens (below 480px)

## How It Works

### Crew Count Detection and Distribution
- **Total Crew**: Automatically extracted from the CWD content
  - First tries to find "CREW NUMBER: XX" in the header
  - If not found, counts crew entries that start with a number and dot
- **Flight Deck Crew**: Typically 20% of total crew, split between captains and first officers
  - For even numbers, the split is 50/50 (e.g., 4 crew = 2 captains, 2 first officers)
  - For odd numbers, first officers get the extra position (e.g., 5 crew = 2 captains, 3 first officers)
- **Stewards**: Automatically calculated as (Total Crew - Flight Deck Crew) initially
- **DHC (Deadhead Crew)**: Priority-based assignment:
  - When changing Flight Deck Crew: Stewards are adjusted automatically to maintain total
  - When changing Stewards: Flight Deck Crew remains unchanged, excess crew become DHC
  - DHC = Total - (Flight Deck + Stewards)

### Crew Role Priority
The application uses a priority-based system for assigning crew roles:
1. **Flight Deck Crew** (highest priority): When changed, other roles adjust to accommodate
2. **Stewards**: When changed, only affects DHC count, not Flight Deck
3. **DHC** (lowest priority): Automatically calculated as the remainder

### Intelligent Date Parsing
The application uses a unified date parsing function that handles both birth dates and expiry dates:

#### Birth Dates (DDMMMYY format)
- Birth year century is determined by comparing with current year:
  - If year suffix > current year suffix, it's from the previous century
  - If year suffix ≤ current year suffix, it's from the current century
- Example: In 2024, "26APR86" is parsed as 1986-04-26 (since 86 > 24)
- Example: In 2024, "26APR12" is parsed as 2012-04-26 (since 12 < 24)

#### Expiry Dates (YYMMDD format)
- Expiry dates must always be in the future:
  - First assumed to be in 2000s (20xx)
  - If that would place the date in the past, uses 2100s (21xx) instead
- Example: In 2024, "290509" is parsed as 2029-05-09
- Example: In 2024, "150509" is parsed as 2115-05-09 (since 2015 is in the past)

### Name Handling
- Extracts exactly 28 characters for the name after the crew number
- Replaces slashes with spaces while preserving all characters
- Properly handles multi-part names like "ZHANG/JIN OU" → "ZHANG JIN OU"

### Responsive Design
- **Large Screens (1280px+)**: Standard font size with spacious layout
- **Medium Screens (768px-1279px)**: Slightly reduced font size while maintaining side-by-side layout
- **Mobile Devices (below 768px)**: Vertical layout with stacked input/output and smaller fonts
- **Very Small Screens (below 480px)**: Compact layout with minimized padding and tiny fonts

## Example

The application processes crew information from formats like:
```
 CWD:CA0984/03APR25   LAX PEK                                     CREW NUMBER:19
 NO.             NAME             ORG DST CNT G  BIRTH   PSPT-NM  EXPRIY TYP CKI
 --- ---------------------------- --- --- --- - ------- --------- ------ --- ---
  1. ZHANG/YUN                    LAX PEK CHN M 26APR86 SE0119322 290509        
  2. ZHANG/JIN OU                 LAX PEK CHN F 10APR02 SE1035473 290914        
```

And converts it to:
```

CREW LIST
CA0984/2025/04/03 B777 LAX--PEK
CAPT ZHANG YUN                  M 1986/04/26 SE0119322 2029/05/09 CHN
FO   ZHANG JIN OU               F 2002/04/10 SE1035473 2029/09/14 CHN
```

## Example DHC Calculation

For a total crew of 19:
- Initial distribution: 4 Flight Deck (2 CAPT, 2 FO) and 15 Stewards, 0 DHC
- If Flight Deck increases to 6: Stewards becomes 13, still 0 DHC
- If Stewards decrease to 10: Flight Deck remains 4, DHC becomes 5
- If total is 22 but Flight Deck is 6 and Stewards is 14: DHC becomes 2

## Technical Details

### Event Handling
- Paste event: Automatically detects crew count and sets parameters
- Input changes: Updates linked crew counts to maintain total
- Convert button: Processes CWD to GD format with current parameters
- Copy button: Copies GD output to clipboard with visual feedback
- Resize event: Dynamically adjusts UI based on screen size

### Error Handling
- Provides detailed error messages in the console for debugging
- Fallback mechanisms for parsing problematic dates
- Skip invalid crew entries with insufficient data
- Validation before conversion to ensure all required data is present