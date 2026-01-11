from flask import Flask, jsonify, request
from flask_cors import CORS
import swisseph as swe

app = Flask(__name__)
CORS(app)



swe.set_ephe_path('/Users/shelby/Coding Projects/Astro 2026/eph/ephe_data')

############################ Test Data #############################
""" 
year = 2000
month = 6
day = 16
hour = 1
mins = 11
secs = 11
tzoffset = -4.0 # For Lagrangre
lat = 33.03622
lon = -85.03133
hsys = b"W" # whole sign house system
"""
######################## Arrays and Dictionaries ###################
# A dictionary mapping string names to integar constants 
PLANETS = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mars': swe.MARS,
    'Mercury': swe.MERCURY,
    'Jupiter': swe.JUPITER,
    'Venus': swe.VENUS,
    'Saturn': swe.SATURN,
    'Rahu': swe.MEAN_NODE  # or TRUE_NODE
}

SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 
    'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

#################### Sign, Nakshatra And House Functions ###################
def get_sign(degree):
    degree = degree % 360 # Normalize to 0-360
    sign_num = int(degree / 30) # Get a sign num (0-11)
    degree_in_sign = degree % 30 # Get degree within a sign (0-29.99)
    return SIGNS[sign_num], degree_in_sign

def get_nakshatra(degree):
    degree = degree % 360 # Normalize to 0-360
    nakshatra_size = 360 / 27 # Each nakshatra is 13.333... degrees (13°20')
    nak_num = int(degree / nakshatra_size) # Get nakshatra number (0-26)
    degree_in_nak = degree % nakshatra_size # Get degree within nakshatra
    pada = int(degree_in_nak / (nakshatra_size / 4)) + 1 # Get pada (quarter) - each nakshatra has 4 padas
    return NAKSHATRAS[nak_num], pada

# Calculate houses
def get_houses(ascendant_degree):
    asc_sign_num = int(ascendant_degree / 30) % 12 # sign num(0-11)

    houses = {}

    for house_num in range(1, 13):
        sign_num = (asc_sign_num + house_num - 1) % 12

        houses[house_num] = {
            'sign': SIGNS[sign_num],
            'sign_number': sign_num,
            'start_degree': sign_num * 30,
            'end_degree': (sign_num * 30 + 30) % 360
        }

    return houses

#################### Planet Strengths ###################

class PlanetaryStrength:
    def __init__(self):

        self.exaltations = {
            'Sun': 'Aries',
            'Moon': 'Taurus',
            'Mars': 'Capricorn',
            'Mercury': 'Virgo',
            'Jupiter': 'Cancer',
            'Venus': 'Pisces',
            'Saturn': 'Libra',
            'Rahu': 'Scorpio',
            'Ketu': 'Scorpio'
        }

        self.debilitations = {
            'Sun': 'Libra',
            'Moon': 'Scorpio',
            'Mars': 'Cancer',
            'Mercury': 'Pisces',
            'Jupiter': 'Capricorn',
            'Venus': 'Virgo',
            'Saturn': 'Aries',
            'Rahu': 'Taurus',
            'Ketu': 'Taurus'
        }

        self.exalt_debil_degree = {
            'Sun': 10,
            'Moon': 3,
            'Mars': 28,
            'Mercury': 15,
            'Jupiter': 5,
            'Venus': 27,
            'Saturn': 20,
            'Rahu': None, 
            'Ketu': None
        }

        self.positive_constellation = {
            'Sun': 'Leo',
            'Moon': 'Cancer',
            'Mars': 'Aries',
            'Mercury': 'Gemini',
            'Jupiter': 'Sagittarius',
            'Venus': 'Libra',
            'Saturn': 'Aquarius',
            'Rahu': None, 
            'Ketu': None
        }

        self.negative_constellation = {
            'Sun': None,
            'Moon': None,
            'Mars': 'Scorpio',
            'Mercury': 'Virgo',
            'Jupiter': 'Pisces',
            'Venus': 'Taurus',
            'Saturn': 'Capricorn',
            'Rahu': None, 
            'Ketu': None
        }

        self.mulatrikona = {
            'Sun': 'Leo',
            'Moon': 'Taurus',
            'Mars': 'Aries',
            'Mercury': 'Virgo',
            'Jupiter': 'Sagittarius',
            'Venus': 'Libra',
            'Saturn': 'Aquarius',
            'Rahu': None, 
            'Ketu': None
        }

        self.mulatrikona_degree = {
            'Sun': (0, 21),
            'Moon': (4, 31),
            'Mars': (0, 13),
            'Mercury': (16, 21),
            'Jupiter': (0, 11),
            'Venus': (0, 16),
            'Saturn': (0, 21),
            'Rahu': None, 
            'Ketu': None
        }

        self.friends = {
            'Sun': ['Moon', 'Mars', 'Jupiter'],
            'Moon': ['Sun', 'Mercury'],
            'Mars': ['Sun', 'Moon', 'Jupiter'],
            'Mercury': ['Sun', 'Venus'],
            'Jupiter': ['Sun', 'Moon', 'Mars'],
            'Venus': ['Mercury', 'Saturn'],
            'Saturn': ['Mercury', 'Venus'],
            'Rahu': [], 
            'Ketu': []
        }

        self.neutrals = {
            'Sun': ['Mercury'],
            'Moon': ['Venus', 'Mars', 'Jupiter', 'Saturn'],
            'Mars': ['Venus', 'Saturn'],
            'Mercury': ['Mars', 'Saturn', 'Jupiter'],
            'Jupiter': ['Saturn'],
            'Venus': ['Mars', 'Jupiter'],
            'Saturn': ['Jupiter'],
            'Rahu': [], 
            'Ketu': []
        }

        self.enemies = {
            'Sun': ['Venus', 'Saturn'],
            'Moon': ['None'],
            'Mars': ['Mercury'],
            'Mercury': ['Moon'],
            'Jupiter': ['Mercury', 'Venus'],
            'Venus': ['Sun', 'Moon'],
            'Saturn': ['Sun', 'Moon', 'Mars'],
            'Rahu': [], 
            'Ketu': []
        }

        self.rulerships = {
            'Sun': ['Leo'],
            'Moon': ['Cancer'],
            'Mars': ['Aries', 'Scorpio'],
            'Mercury': ['Gemini', 'Virgo'],
            'Jupiter': ['Sagittarius', 'Pisces'],
            'Venus': ['Taurus', 'Libra'],
            'Saturn': ['Capricorn', 'Aquarius'],
            'Rahu': [], 
            'Ketu': []
        }

        pass

    def get_sign_ruler(self, sign):
        for planet, signs in self.rulerships.items(): # For the planet and sign
            if sign in signs:
                return planet
        return None

    # Calculate dignity / state
    def get_dignity(self, planet, sign, degree=None):

        if self.exaltations.get(planet) == sign: # if exalted planet equals current sign
            return 'Exalted'
                
        elif self.mulatrikona.get(planet) == sign:
            return 'Mulatrikona'
        
        elif self.positive_constellation.get(planet) == sign:
            return 'Own Sign (positive)'
        
        elif self.negative_constellation.get(planet) == sign:
            return 'Own Sign (negative)'
        
        sign_ruler = self.get_sign_ruler(sign)

        if sign_ruler in self.friends.get(planet, []): # gets friends list 
            return 'Friend Sign'
        
        elif sign_ruler in self.neutrals.get(planet, []):
            return 'Neutral Sign'
        
        elif sign_ruler in self.enemies.get(planet, []):
            return 'Enemy Sign'
        
        elif self.debilitations.get(planet) == sign:
            return 'Debilitated'

        return 'none'

    def calculate_strength(self, planet, sign, degree=None):
        dignity = self.get_dignity(planet, sign, degree)

        match dignity:
            case 'Exalted':
                base_strength = "87.5 - 100"
            case 'Mulatrikona':
                base_strength = "75 - 87.5"
            case 'Own Sign (positive)':
                base_strength = "62.5 - 75"
            case 'Own Sign (negative)':
                base_strength = "50 - 62.5"
            case 'Friend Sign':
                base_strength = "37.5 - 50"
            case 'Neutral Sign':
                base_strength = "25 - 37.5"
            case 'Enemy Sign':
                base_strength = "12.5 - 25"
            case 'Debilitated':
                base_strength = "0 - 12.5"
            case _:
                base_strength = "N/A"

        return base_strength

########################  FLASK ROUTE  ###############################
@app.route('/api/chart', methods=['POST'])
def calculate_chart():
    # Expects JSON with: year, month, day, hour, minute, latitude, longitude
    try:
        data = request.json

        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

        year = data['year']
        month = data['month']
        day = data['day']
        hour = data['hour']
        mins = data['mins']
        secs = data['secs']
        lat = data['lat']
        lon = data['lon']
        tzoffset = data['tzoffset']
        hsys = data['hsys']

        # 'W' becomes b'W'
        if isinstance(hsys, str):
            hsys = hsys.encode('ascii')
        else:
            hsys = hsys

#                           Set Mode                                 #

        gregflag = 1
        # Set Lahiri ayanamsa (most common for Vedic astrology)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

#                            Date Time / Conversion                  #

        # Get UTC "Coordinated Universal Time"
        utc = swe.utc_time_zone(year, month, day, hour, mins, secs, tzoffset)

        # Get julian day number in Universal and Ephemeris Time
        jd_tuple = swe.utc_to_jd(*utc)
        jdet = jd_tuple[1]

####################### Find Planet Data ###########################
        planet_data = {}

        # Create an instance for PlanetaryStrength
        strength_calculator = PlanetaryStrength()

        for name, planet_id in PLANETS.items(): # assigns the identifiers to items in the dictionary 
            # Get the position fron the API
            pos = swe.calc(jdet, planet_id, flags)
            degree = pos[0][0] # First in the tuple

            # Calculate the sign and nakshatra
            sign, degree_in_sign = get_sign(degree)
            nakshatra, pada = get_nakshatra(degree)


            # DEBUG: Print what's being checked
            if name == 'Mercury':  # Only for Mercury to reduce clutter
                print(f"\n=== DEBUGGING MERCURY ===")
                print(f"Mercury is in sign: {sign}")
                print(f"Positive constellations: {strength_calculator.positive_constellation}")
                print(f"Does positive_constellation have Mercury? {strength_calculator.positive_constellation.get('Mercury')}")
                print(f"========================\n")

            # Calculate planet strengths
            dignity = strength_calculator.get_dignity(name, sign, degree_in_sign)
            strength = strength_calculator.calculate_strength(name, sign, degree_in_sign)

            # Store in a dictionary
            planet_data[name] = {
                'degree': float(degree),
                'sign': sign,
                'degree_in_sign': float(degree_in_sign),
                'nakshatra': nakshatra,
                'pada': int(pada),
                'dignity': dignity,
                'strength_range': strength
            }

            # Print formated output
            # (":10" makes the output take up to characters. ":6.2f" is 6 characters 2 decimal places)
            print(f"{name:10} {degree:6.2f}° - {sign:12} {degree_in_sign:5.2f}° - {nakshatra:20} Pada {pada} - Dignity: {dignity:15} Strength: {strength}") 

####################### Find House Data ###########################

        # Get data from the API
        house_data = swe.houses_ex2(jdet, lat, lon, hsys, flags)
        ascendant_degree = house_data[1][0]

        # Get houses
        houses = get_houses(ascendant_degree)

        print("HOUSE SYSTEM:")
        print("=" * 60)
        for house_num, house_info in houses.items():
            print(f"House {house_num:2}: {house_info['sign']:12}")

        print("\n" + "=" * 60)

        return jsonify({
            'success': True,
            'ascendant': ascendant_degree,
            'planets': planet_data,
            'houses': houses
            })

    except Exception as e:
        # Handle errors
        import traceback 
        import sys

        # Get the traceback as a string
        exc_type, exc_value, exc_traceback = sys.exc_info()

        # Format the traceback
        tb_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
        tb_text = ''.join(tb_lines)

        # Print to console (for your debugging)
        print("=" * 60)
        print("ERROR OCCURRED:")
        print(tb_text)
        print("=" * 60)
        
        # Get just the last traceback entry (the actual error location)
        tb = traceback.extract_tb(exc_traceback)
        last_call = tb[-1] if tb else None

        error_response = {
            'success': False,
            'error': str(e),
            'error_type': exc_type.__name__ if exc_type else 'Unknown',
            'full_traceback': tb_text
        }

        # Add location info if available
        if last_call:
            error_response.update({
                'file': last_call.filename,
                'line': last_call.lineno,
                'function': last_call.name,
                'code': last_call.line
            })

        return jsonify(error_response), 400

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple endpoint to check if API is running"""
    return jsonify({
        'status': 'ok',
        'message': 'Vedic Astrology API is running'
    })

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'Vedic Astrology API',
        'endpoints': {
            '/api/health': 'GET - Check API status',
            '/api/chart': 'POST - Calculate birth chart'
        }
    })

swe.close 

# Unpack properly
# cusps      = house_data[0]  # 12 house cusps
# ascmc      = house_data[1]  # ASC, MC, ARMC, Vertex, etc
# cusps_spd  = house_data[2]  # optional: house cusp speeds
# ascmc_spd  = house_data[3]  # optional: ASC/MC speeds

if __name__ == '__main__':
    app.run(debug=True, port=5001)