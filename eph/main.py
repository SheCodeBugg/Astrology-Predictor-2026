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
        flags = swe.FLG_SWIEPH 
        # set sidereal mode
        mode = swe.set_sid_mode(flags)

#                            Date Time / Conversion                  #

        # Get UTC "Coordinated Universal Time"
        utc = swe.utc_time_zone(year, month, day, hour, mins, secs, tzoffset)

        # Get julian day number in Universal and Ephemeris Time
        jd_tuple = swe.utc_to_jd(*utc)
        jdet = jd_tuple[1]

####################### Find Planet Data ###########################
        planet_data = {}

        for name, planet_id in PLANETS.items(): # assigns the identifiers to items in the dictionary 
            # Get the position fron the API
            pos = swe.calc(jdet, planet_id, flags)
            degree = pos[0][0] # First in the tuple

            # Calculate the sign and nakshatra
            sign, degree_in_sign = get_sign(degree)
            nakshatra, pada = get_nakshatra(degree)

            # Store in a dictionary
            planet_data[name] = {
                'degree': float(degree),
                'sign': sign,
                'degree_in_sign': float(degree_in_sign),
                'nakshatra': nakshatra,
                'pada': int(pada)
            }

            # Print formated output
            # (":10" makes the output take up to characters. ":6.2f" is 6 characters 2 decimal places)
            print(f"{name:10} {degree:6.2f}° - {sign:12} {degree_in_sign:5.2f}° - {nakshatra:20} Pada {pada}") 

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