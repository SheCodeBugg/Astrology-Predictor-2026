from datetime import datetime, timedelta
from flask import Flask, jsonify, request

class DashaCalculator:

    PLANET_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']

    DASHA_YEARS = {
        'Ketu': 7, 'Venus': 20, 'Sun': 6, 'Moon': 10, 'Mars': 7, 
        'Rahu': 18, 'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
    }

    # Initiate an object with a class constructor
    def __init__(self, birth_date, moon_nak_degree, moon_nak):
        self.birth_date = birth_date
        self.moon_nak_degree = moon_nak_degree
        self.moon_nak = moon_nak

    def get_nak_lord(self, nakshatra):
        nak_lords = {
            'Ashvini': 'Ketu', 'Bharani': 'Venus', 'Krittika': 'Sun',
            'Rohini': 'Moon', 'Mrigashirsha': 'Mars', 'Ardra': 'Rahu',
            'Punarvasu': 'Jupiter', 'Pushya': 'Saturn', 'Ashlesha': 'Mercury',
            'Magha': 'Ketu', 'Purva Phalguni': 'Venus', 'Uttara Phalguni': 'Sun',
            'Hasta': 'Moon', 'Chitra': 'Mars', 'Swati': 'Rahu',
            'Vishakha': 'Jupiter', 'Anuradha': 'Saturn', 'Jyeshtha': 'Mercury',
            'Mula': 'Ketu', 'Purva Ashadha': 'Venus', 'Uttara Ashadha': 'Sun',
            'Shravana': 'Moon', 'Dhanishtha': 'Mars', 'Shatabhisha': 'Rahu',
            'Purva Bhadrapada': 'Jupiter', 'Uttara Bhadrapada': 'Saturn', 'Revati': 'Mercury'
        }

        lord = nak_lords.get(nakshatra)

        if lord is None:
            raise ValueError(f"Unknown nakshatra: {nakshatra}")

        return lord
    
    def calculate_dasha_start(self):
        # return years remaining in start dasha
        birth_lord = self.get_nak_lord(self.moon_nak)
        total_years = self.DASHA_YEARS[birth_lord]

        proportion_completed = self.moon_nak_degree / 13.33

        # Years left
        years_elapsed = total_years * proportion_completed
        years_remaining = total_years - years_elapsed

        return birth_lord, years_remaining

    def get_next_planet(self, current_planet):
        current_index = self.PLANET_SEQUENCE.index(current_planet)
        next_index = (current_index + 1) % 9
        return self.PLANET_SEQUENCE[next_index]

    def calculate_mahadashas(self, num_cycles: int = 2):
        # calc for a specified num of 120 year cycles
        birth_lord, years_remaining = self.calculate_dasha_start()

        mahadashas = []
        current_date = self.birth_date
        current_planet = birth_lord

        # First mahadasha
        end_date = current_date + timedelta(days=years_remaining * 365.25) # Converts years to days 
        mahadashas.append({
            'planet': current_planet,
            'start_date': current_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'years': round(years_remaining, 2),
            'level': 'mahadasha',
            'id': f"maha_{current_planet}_{current_date.strftime('%Y%m%d')}"
        })

        # Next mahdashas
        current_date = end_date

        total_dashas = 9 * num_cycles - 1 

        for i in range(total_dashas):
            current_planet = self.get_next_planet(current_planet)
            years = self.DASHA_YEARS[current_planet]
            end_date = current_date + timedelta(days=years * 365.25)

            mahadashas.append({
                'planet': current_planet,
                'start_date': current_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'years': years,
                'level': 'mahadasha',
                'id': f"maha_{current_planet}_{current_date.strftime('%Y%m%d')}"
            })
            current_date = end_date

        return mahadashas

    def calculate_antardashas(self, mahadasha_planet, start_date_str, mahadasha_years):
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        start_index = self.PLANET_SEQUENCE.index(mahadasha_planet)

        antardashas = []
        current_date = start_date

        for i in range(9):
            antar_planet = self.PLANET_SEQUENCE[(start_index + i) % 9]

            antar_years = (mahadasha_years * self.DASHA_YEARS[antar_planet] / 120)
            end_date = current_date + timedelta(days=antar_years * 365.25)

            antardashas.append({
                'planet': antar_planet,
                'start_date': current_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'years': round(antar_years, 3),
                'months': round(antar_years * 12, 1),
                'level': 'antardasha',
                'parent': mahadasha_planet,
                'id': f"antar_{mahadasha_planet}_{antar_planet}_{current_date.strftime('%Y%m%d')}"
            })
            current_date = end_date

        return antardashas

    def calculate_pratyantardashas(self, mahadasha_planet, antar_planet,
                                start_date_str, antar_years):
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        start_index = self.PLANET_SEQUENCE.index(antar_planet)

        pratyantardashas = []
        current_date = start_date

        for i in range(9):
            pratyantar_planet = self.PLANET_SEQUENCE[(start_index + i) % 9]

            pratyantar_years = (antar_years * self.DASHA_YEARS[pratyantar_planet]) / 120
            end_date = current_date + timedelta(days=pratyantar_years * 365.25)
                
            pratyantardashas.append({
                'planet': pratyantar_planet,
                'start_date': current_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'years': round(pratyantar_years, 4),
                'months': round(pratyantar_years * 12, 2),
                'days': round(pratyantar_years * 365.25, 0),
                'level': 'pratyantardasha',
                'parent': f"{mahadasha_planet}-{antar_planet}",                
                'id': f"pratyantar_{mahadasha_planet}_{antar_planet}_{pratyantar_planet}_{current_date.strftime('%Y%m%d')}"
            })
            current_date = end_date        
        return pratyantardashas

def register_dasha_routes(app):

    @app.route('/api/dashas/mahadashas', methods=['POST'])
    def get_mahadasha():

        try:
            data = request.json
            print("=== MAHADASHA REQUEST DATA ===")
            print(data)
            print("=" * 40)

            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            birth_data = data.get('birth_data')
            if not birth_data:
                return jsonify({'error': 'Missing birth_data'}), 400

            birth_date = datetime(
                birth_data['year'], birth_data['month'], birth_data['day']
            )

            moon_nakshatra_degree = data['moon_nakshatra_degree']
            moon_nakshatra = data['moon_nakshatra']

            if moon_nakshatra_degree is None or moon_nakshatra is None:
                return jsonify({'error': 'Missing moon nakshatra data'}), 400
           
            calculator = DashaCalculator(birth_date, moon_nakshatra_degree, moon_nakshatra)
            mahadashas = calculator.calculate_mahadashas(num_cycles=2)

            return jsonify({
                'mahadashas': mahadashas,
                'birth_dasha_start': calculator.calculate_dasha_start()
            })


        except ValueError as e:
            print(f"ValueError: {e}")
            return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
        except Exception as e:
            print(f"Exception: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500
        
    @app.route('/api/dashas/antardashas', methods=['POST'])
    def get_antardashas():

        try:
            data = request.json
            print("=== ANTARDASHA REQUEST DATA ===")
            print(data)
            print("=" * 40)

            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400

            birth_data = data.get('birth_data')
            if not birth_data:
                return jsonify({'error': 'Missing birth_data'}), 400

            birth_date = datetime(
                birth_data['year'], birth_data['month'], birth_data['day']
            )

            moon_nak_degree = data.get('moon_nakshatra_degree')
            moon_nak = data.get('moon_nakshatra')
            mahadasha_planet = data.get('mahadasha_planet')
            start_date = data.get('start_date')
            mahadasha_years = data.get('mahadasha_years')

            if not all([moon_nak_degree is not None, moon_nak, mahadasha_planet, start_date, mahadasha_years]):
                return jsonify({'error': 'Missing required fields'}), 400

            calculator = DashaCalculator(birth_date, moon_nak_degree, moon_nak)

            antardashas = calculator.calculate_antardashas(
                mahadasha_planet=data['mahadasha_planet'],
                start_date_str=data['start_date'],
                mahadasha_years=data['mahadasha_years']
            )

            return jsonify({'antardashas': antardashas})
            
        except ValueError as e:
            print(f"ValueError: {e}")
            return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
        except Exception as e:
            print(f"Exception: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500
            
    @app.route('/api/dashas/pratyantardashas', methods=['POST'])
    def get_pratyantardashas():

        try:
            data = request.json
            print("=== PRATYANTARDASHA REQUEST DATA ===")
            print(data)
            print("=" * 40)

            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            birth_data = data.get('birth_data')
            if not birth_data:
                return jsonify({'error': 'Missing birth_data'}), 400

            birth_date = datetime(
                birth_data['year'], birth_data['month'], birth_data['day']
            )

            moon_nakshatra_degree = data.get('moon_nakshatra_degree')
            moon_nakshatra = data.get('moon_nakshatra')
            mahadasha_planet = data.get('mahadasha_planet')
            antardasha_planet = data.get('antardasha_planet')
            start_date = data.get('start_date')
            antardasha_years = data.get('antardasha_years')

            if not all([moon_nakshatra_degree is not None, moon_nakshatra, mahadasha_planet, 
                       antardasha_planet, start_date, antardasha_years]):
                return jsonify({'error': 'Missing required fields'}), 400
            
            calculator = DashaCalculator(birth_date, moon_nakshatra_degree, moon_nakshatra)
            
            pratyantardashas = calculator.calculate_pratyantardashas(
                mahadasha_planet=data['mahadasha_planet'],
                antar_planet=data['antardasha_planet'],
                start_date_str=data['start_date'],
                antar_years=data['antardasha_years']
            )

            return jsonify({'pratyantardashas': pratyantardashas})
        
        except ValueError as e:
            print(f"ValueError: {e}")
            return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
        except Exception as e:
            print(f"Exception: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500