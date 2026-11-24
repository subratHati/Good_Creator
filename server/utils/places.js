// utils/places.js
//
// Knows the official names of India's states and main cities, the other names
// people use for them (Bombay = Mumbai, Orissa = Odisha ...) and how to read
// spellings that are slightly off. Used to
//   - search by city / state (so "Bombay" finds Mumbai),
//   - rank creators for a brand,
//   - tidy up the locations people typed in before we had drop-down lists
//     (scripts/normalizeLocations.js).
// The same list of states and cities is also in the client (utils/indiaLocations.js).
// If you add a city here, add it there too.

const INDIA_LOCATIONS = {
  'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Mayabunder', 'Rangat', 'Car Nicobar'],
  'Andhra Pradesh': ['Amaravati', 'Anantapur', 'Chittoor', 'Eluru', 'Guntur', 'Kadapa', 'Kakinada', 'Kurnool', 'Machilipatnam', 'Nellore', 'Ongole', 'Rajahmundry', 'Srikakulam', 'Tirupati', 'Vijayawada', 'Visakhapatnam', 'Vizianagaram', 'Tadepalligudem', 'Bhimavaram', 'Chirala', 'Razole', 'Rayachoti', 'Podili', 'Gudivada', 'Punganur', 'Proddatur', 'Bapatla', 'Tuni', 'Mandapeta', 'Nandyal'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Along'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Dhubri', 'Diphu', 'Goalpara', 'Karimganj', 'North Lakhimpur', 'Sivasagar', 'Kokrajhar', 'Barpeta', 'Nalbari', 'Morigaon', 'Golaghat', 'Dhemaji', 'Hojai', 'Mangaldai', 'Digboi', 'Lumding', 'Jagiroad', 'Dhekiajuli', 'Biswanath Chariali', 'Lakhimpur', 'Tangla', 'Naharkatia', 'Bokajan', 'Gohpur', 'Haflong', 'Charaideo'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Samastipur', 'Hajipur', 'Sasaram', 'Dehri', 'Siwan', 'Motihari', 'Nawada', 'Bettiah', 'Saharsa', 'Aurangabad', 'Buxar', 'Madhubani', 'Sitamarhi', 'Supaul', 'Gopalganj', 'Jamui', 'Kishanganj', 'Khagaria', 'Madhepura', 'Banka', 'Lakhisarai', 'Arwal', 'Bodh Gaya', 'Raxaul', 'Sultanganj', 'Forbesganj', 'Araria', 'Ramnagar', 'Jehanabad', 'Sheikhpura'],
  'Chandigarh': ['Chandigarh'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Dhamtari', 'Mahasamund', 'Kanker', 'Balod', 'Sarangarh', 'Dalli Rajhara', 'Bhanupratappur', 'Balrampur', 'Kondagaon', 'Kurud', 'Jashpur', 'Kawardha', 'Baloda Bazar', 'Surajpur', 'Pali', 'Naya Raipur'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Calangute'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad', 'Morbi', 'Mehsana', 'Bharuch', 'Vapi', 'Navsari', 'Valsad', 'Porbandar', 'Surendranagar', 'Bhuj', 'Gandhidham', 'Palanpur', 'Godhra', 'Patan', 'Amreli', 'Ankleshwar', 'Dahod', 'Gondal', 'Tharad', 'Prantij', 'Veraval', 'Visnagar', 'Vyara', 'Dhanera', 'Halol', 'Anjar', 'Kapadvanj', 'Umbergaon', 'Modasa', 'Idar', 'Unjha', 'Jetpur', 'Viramgam', 'Mahuva', 'Jambusar', 'Vijapur', 'Harij', 'Bardoli'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar', 'Kaithal', 'Rewari', 'Palwal', 'Narnaul', 'Fatehabad', 'Jhajjar', 'Mahendragarh', 'Narwana', 'Shahbad', 'Siwani', 'Dharuhera', 'Safidon', 'Hansi', 'Assandh', 'Kurukshetra'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Hamirpur', 'Una', 'Bilaspur', 'Chamba', 'Nahan', 'Palampur', 'Baddi', 'Kangra', 'Nalagarh'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua', 'Udhampur', 'Pulwama', 'Budgam', 'Kupwara', 'Rajouri', 'Poonch', 'Ganderbal', 'Kishtwar', 'Bandipora', 'Doda', 'Samba', 'Kulgam', 'Reasi'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Chirkunda', 'Phusro', 'Adityapur', 'Chaibasa', 'Dumka', 'Lohardaga', 'Sahibganj', 'Jamtara', 'Gumla', 'Godda', 'Koderma', 'Garhwa', 'Simdega'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Raichur', 'Bidar', 'Hosapete', 'Udupi', 'Hassan', 'Gadag', 'Mandya', 'Chitradurga', 'Chikkamagaluru', 'Kolar', 'Madikeri', 'Karwar', 'Bagalkot', 'Ramanagara', 'Chikkaballapur', 'Tiptur', 'Sira', 'Doddaballapur', 'Gokarna', 'Nipani', 'Yelandur', 'Gokak', 'Hoskote', 'Dandeli', 'Bangarpet', 'Manvi', 'Maddur', 'Humnabad', 'Manipal', 'Sedam', 'Harihar', 'Holalkere', 'Challakere', 'Chamarajanagar', 'Bidadi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kottayam', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad', 'Ernakulam', 'Muvattupuzha', 'Thalassery', 'Kayamkulam', 'Guruvayur', 'Varkala', 'Attingal', 'Neyyattinkara', 'Changanassery', 'Perinthalmanna', 'Kunnamkulam', 'Thiruvalla', 'Tirur', 'Ottappalam', 'Anchal', 'Edappal', 'Haripad', 'Payyanur', 'Chalakudy', 'Chavakkad', 'Valanchery', 'Thodupuzha', 'Tanur', 'Muthukulam', 'Kottakkal', 'Chengannur', 'Kodungallur'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy', 'Amini'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Chhatarpur', 'Damoh', 'Mandsaur', 'Khargone', 'Neemuch', 'Pithampur', 'Hoshangabad', 'Itarsi', 'Sehore', 'Betul', 'Seoni', 'Datia', 'Nagda', 'Dhar', 'Morena', 'Panna', 'Balaghat', 'Katni', 'Shajapur', 'Tikamgarh', 'Raisen', 'Harda', 'Sironj', 'Jaora', 'Nasrullaganj', 'Shujalpur', 'Mandideep', 'Sanawad', 'Mandla', 'Anuppur', 'Niwari', 'Badnawar', 'Maihar', 'Pachmarhi', 'Dabra', 'Sendhwa', 'Pipariya', 'Bina', 'Petlawad', 'Shahdol', 'Narsinghpur', 'Ashoknagar', 'Sheopur'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna', 'Ambarnath', 'Bhiwandi', 'Panvel', 'Kalyan', 'Dombivli', 'Vasai', 'Virar', 'Mira Bhayandar', 'Ulhasnagar', 'Pimpri-Chinchwad', 'Malegaon', 'Nanded', 'Satara', 'Beed', 'Yavatmal', 'Wardha', 'Gondia', 'Bhandara', 'Ratnagiri', 'Osmanabad', 'Nandurbar', 'Buldhana', 'Hingoli', 'Washim', 'Gadchiroli', 'Baramati', 'Lonavala', 'Alibag', 'Sindhudurg', 'Shirdi', 'Palghar', 'Rajura', 'Shirpur', 'Mumbra', 'Katol', 'Chopda', 'Udgir', 'Miraj', 'Dahanu', 'Ramtek', 'Roha', 'Chiplun', 'Badlapur', 'Sangamner', 'Karjat', 'Mehkar', 'Wani', 'Warud', 'Digras', 'Paratwada', 'Shrirampur', 'Kankavli', 'Tumsar', 'Pandharpur'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul', 'Senapati', 'Tamenglong'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Baghmara', 'Williamnagar', 'Mawlai'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Saiha', 'Lawngtlai', 'Mamit'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon', 'Phek'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Bargarh', 'Rayagada', 'Angul', 'Dhenkanal', 'Kendujhar', 'Koraput', 'Paradip', 'Jajpur', 'Talcher', 'Bolangir', 'Kendrapara', 'Sundargarh', 'Brahmapur', 'Phulbani', 'Nabarangpur', 'Malkangiri', 'Nayagarh', 'Khordha', 'Jagatsinghpur', 'Keonjhar', 'Barbil', 'Hinjilicut', 'Titlagarh', 'Sonepur', 'Deogarh', 'Gunupur', 'Rajgangpur', 'Nuapada'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Firozpur', 'Kapurthala', 'Rajpura', 'Sangrur', 'Faridkot', 'Fazilka', 'Gurdaspur', 'Zirakpur', 'Rupnagar', 'Anandpur Sahib', 'Kotkapura', 'Sri Muktsar Sahib', 'Phillaur', 'Morinda', 'Nawanshahr', 'Chamkaur Sahib', 'Mandi Gobindgarh', 'Talwandi Sabo', 'Kharar', 'Mukerian', 'Samana', 'Kalanaur', 'Fatehgarh Sahib', 'Sunam', 'Patran'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Bhilwara', 'Alwar', 'Sikar', 'Bharatpur', 'Pali', 'Sri Ganganagar', 'Tonk', 'Kishangarh', 'Beawar', 'Hanumangarh', 'Churu', 'Jhunjhunu', 'Dholpur', 'Barmer', 'Jaisalmer', 'Chittorgarh', 'Nagaur', 'Sawai Madhopur', 'Banswara', 'Baran', 'Bundi', 'Dausa', 'Rajsamand', 'Mount Abu', 'Pushkar', 'Neemrana', 'Sirohi', 'Jalore', 'Jhalawar', 'Didwana', 'Pratapgarh', 'Fatehpur', 'Patan', 'Dungarpur', 'Karauli', 'Kotputli', 'Bhiwadi', 'Phalodi', 'Balotra', 'Deeg', 'Pilani', 'Makrana', 'Nokha', 'Suratgarh', 'Anupgarh', 'Raisinghnagar', 'Hindaun', 'Bayana', 'Malpura', 'Nawalgarh', 'Sujangarh', 'Ratangarh', 'Sardarshahar', 'Chirawa'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Singtam', 'Pelling'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumbakonam', 'Rajapalayam', 'Pudukkottai', 'Ambur', 'Nagapattinam', 'Cuddalore', 'Tiruvannamalai', 'Karaikudi', 'Namakkal', 'Pollachi', 'Neyveli', 'Krishnagiri', 'Dharmapuri', 'Virudhunagar', 'Ooty', 'Kodaikanal', 'Tambaram', 'Avadi', 'Mayiladuthurai', 'Theni', 'Perambalur', 'Ariyalur', 'Sivaganga', 'Ramanathapuram', 'Tenkasi', 'Kanyakumari', 'Dharapuram', 'Guduvanchery', 'Manamadurai', 'Thirupattur', 'Tiruvallur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Siddipet', 'Suryapet', 'Miryalaguda', 'Jagtial', 'Mancherial', 'Kothagudem', 'Secunderabad', 'Medak', 'Sangareddy', 'Vikarabad', 'Wanaparthy', 'Bhongir', 'Kamareddy', 'Peddapalli', 'Gadwal', 'Kodad', 'Bhadrachalam', 'Mahabubabad', 'Makthal', 'Pargi', 'Shamshabad', 'Nagarkurnool', 'Narayanpet', 'Bellampalli'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa', 'Khowai', 'Teliamura', 'Sabroom'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Greater Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Vrindavan', 'Shahjahanpur', 'Rampur', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich', 'Unnao', 'Jaunpur', 'Lakhimpur', 'Hathras', 'Banda', 'Pilibhit', 'Barabanki', 'Mainpuri', 'Etah', 'Budaun', 'Azamgarh', 'Ballia', 'Basti', 'Deoria', 'Faizabad', 'Ayodhya', 'Sultanpur', 'Ghazipur', 'Gonda', 'Lalitpur', 'Mau', 'Modinagar', 'Hapur', 'Kasganj', 'Auraiya', 'Farrukhabad', 'Kannauj', 'Chandausi', 'Khurja', 'Shamli', 'Bijnor', 'Kushinagar', 'Baghpat', 'Lakhimpur Kheri', 'Sonbhadra', 'Pratapgarh', 'Balrampur', 'Amethi', 'Chitrakoot', 'Bhadohi', 'Jalaun', 'Kaushambi', 'Siddharthnagar', 'Najibabad', 'Nagina', 'Dhampur', 'Kanpur Dehat', 'Mughalsarai', 'Mahoba'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Nainital', 'Mussoorie', 'Pithoragarh', 'Almora', 'Kotdwar', 'Pauri', 'Tehri', 'Bageshwar', 'Mukteshwar', 'Ramnagar', 'Sitarganj', 'Jaspur', 'Uttarkashi', 'Kichha', 'Karnaprayag', 'Manglaur', 'Tanakpur', 'Champawat', 'Bazpur', 'Joshimath', 'Chamoli', 'Khatima', 'Ranikhet', 'Srinagar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Midnapore', 'Balurghat', 'Basirhat', 'Bankura', 'Chandannagar', 'Darjeeling', 'Alipurduar', 'Purulia', 'Jalpaiguri', 'Bangaon', 'Cooch Behar', 'Kalyani', 'Barasat', 'Serampore', 'Barrackpore', 'Bidhannagar', 'Kalimpong', 'Tamluk', 'Suri', 'Jangipur', 'Bolpur', 'Contai', 'Bishnupur', 'Diamond Harbour', 'Rampurhat', 'Berhampore', 'Murshidabad', 'Chakdaha', 'Kalna', 'Taki', 'Jhargram', 'Arambagh', 'Dinhata', 'Tarakeswar', 'Baduria', 'Bagdogra', 'Falakata', 'Mekhliganj', 'Raghunathganj', 'Sainthia', 'Dalkhola', 'Kaliyaganj', 'Haringhata', 'Bansberia', 'Baidyabati'],
};

// Other names people use for a state. The key is how it might be typed (capitals,
// spaces, dots and & do not matter); the value is the name used on GoodCreator.
const STATE_ALIASES = {
  // old / alternate names
  'Orissa': 'Odisha', 'Uttaranchal': 'Uttarakhand', 'Pondicherry': 'Puducherry', 'Pondichery': 'Puducherry',
  'Bengal': 'West Bengal', 'West Bangal': 'West Bengal', 'Paschim Banga': 'West Bengal', 'Paschim Bangla': 'West Bengal',
  'Andhra': 'Andhra Pradesh', 'Himachal': 'Himachal Pradesh', 'Arunachal': 'Arunachal Pradesh',
  'Telengana': 'Telangana', 'Telangana State': 'Telangana', 'Tamilnadu': 'Tamil Nadu', 'Tamil Nadu State': 'Tamil Nadu',
  'Chattisgarh': 'Chhattisgarh', 'Chhatisgarh': 'Chhattisgarh', 'Chattishgarh': 'Chhattisgarh',
  'Maharastra': 'Maharashtra', 'Maharshtra': 'Maharashtra', 'Gujrat': 'Gujarat', 'Karnatak': 'Karnataka',
  'Kerela': 'Kerala', 'Kerla': 'Kerala', 'Hariyana': 'Haryana', 'Jharkhand State': 'Jharkhand', 'Jharkand': 'Jharkhand',
  // the capital, the merged UTs, J&K and A&N
  'NCT of Delhi': 'Delhi', 'NCT Delhi': 'Delhi', 'National Capital Territory of Delhi': 'Delhi', 'Delhi NCR': 'Delhi', 'New Delhi': 'Delhi', 'Dilli': 'Delhi',
  'Jammu & Kashmir': 'Jammu and Kashmir', 'Jammu Kashmir': 'Jammu and Kashmir', 'Kashmir': 'Jammu and Kashmir', 'J&K': 'Jammu and Kashmir',
  'Andaman & Nicobar': 'Andaman and Nicobar Islands', 'Andaman Nicobar': 'Andaman and Nicobar Islands', 'Andaman': 'Andaman and Nicobar Islands', 'A&N Islands': 'Andaman and Nicobar Islands',
  'Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu', 'Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'Dadra and Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu', 'Dadra & Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'Dadra Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu', 'Daman': 'Dadra and Nagar Haveli and Daman and Diu', 'Diu': 'Dadra and Nagar Haveli and Daman and Diu',
  // short codes
  'AN': 'Andaman and Nicobar Islands', 'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh', 'AS': 'Assam', 'BR': 'Bihar', 'CH': 'Chandigarh',
  'CG': 'Chhattisgarh', 'CT': 'Chhattisgarh', 'DD': 'Dadra and Nagar Haveli and Daman and Diu', 'DN': 'Dadra and Nagar Haveli and Daman and Diu', 'DH': 'Dadra and Nagar Haveli and Daman and Diu',
  'DL': 'Delhi', 'GA': 'Goa', 'GJ': 'Gujarat', 'HR': 'Haryana', 'HP': 'Himachal Pradesh', 'JK': 'Jammu and Kashmir', 'JH': 'Jharkhand',
  'KA': 'Karnataka', 'KL': 'Kerala', 'LA': 'Ladakh', 'LD': 'Lakshadweep', 'MP': 'Madhya Pradesh', 'MH': 'Maharashtra', 'MN': 'Manipur',
  'ML': 'Meghalaya', 'MZ': 'Mizoram', 'NL': 'Nagaland', 'OD': 'Odisha', 'OR': 'Odisha', 'PY': 'Puducherry', 'PB': 'Punjab', 'RJ': 'Rajasthan',
  'SK': 'Sikkim', 'TN': 'Tamil Nadu', 'TS': 'Telangana', 'TG': 'Telangana', 'TR': 'Tripura', 'UP': 'Uttar Pradesh', 'UK': 'Uttarakhand', 'UA': 'Uttarakhand', 'WB': 'West Bengal',
  // Hindi / Devanagari
  'राजस्थान': 'Rajasthan', 'उत्तर प्रदेश': 'Uttar Pradesh', 'उत्तरप्रदेश': 'Uttar Pradesh', 'महाराष्ट्र': 'Maharashtra', 'बिहार': 'Bihar',
  'हरियाणा': 'Haryana', 'दिल्ली': 'Delhi', 'मध्य प्रदेश': 'Madhya Pradesh', 'मध्यप्रदेश': 'Madhya Pradesh', 'गुजरात': 'Gujarat', 'पंजाब': 'Punjab',
  'झारखंड': 'Jharkhand', 'झारखण्ड': 'Jharkhand', 'छत्तीसगढ़': 'Chhattisgarh', 'छत्तीसगढ': 'Chhattisgarh', 'उत्तराखंड': 'Uttarakhand', 'उत्तराखण्ड': 'Uttarakhand',
  'कर्नाटक': 'Karnataka', 'केरल': 'Kerala', 'तमिलनाडु': 'Tamil Nadu', 'तेलंगाना': 'Telangana', 'आंध्र प्रदेश': 'Andhra Pradesh', 'आन्ध्र प्रदेश': 'Andhra Pradesh',
  'ओडिशा': 'Odisha', 'उड़ीसा': 'Odisha', 'पश्चिम बंगाल': 'West Bengal', 'असम': 'Assam', 'हिमाचल प्रदेश': 'Himachal Pradesh', 'जम्मू और कश्मीर': 'Jammu and Kashmir', 'गोवा': 'Goa',
};

// Other names people use for a city. A value of ['Name', 'State'] means the alias
// only counts for that state (the same old name can belong to two places).
const CITY_ALIASES = {
  'Bombay': 'Mumbai', 'Mumbai City': 'Mumbai', 'Greater Mumbai': 'Mumbai', 'Mumbai Suburban': 'Mumbai', 'Mumbai Suburbs': 'Mumbai', 'Mumbay': 'Mumbai', 'Mumbi': 'Mumbai',
  'Bangalore': 'Bengaluru', 'Bangaluru': 'Bengaluru', 'Banglore': 'Bengaluru', 'Bengalooru': 'Bengaluru', 'Bengaluru Urban': 'Bengaluru', 'Bangalore Urban': 'Bengaluru', 'Bangalore City': 'Bengaluru', 'BLR': 'Bengaluru',
  'Calcutta': 'Kolkata', 'Kolkatta': 'Kolkata', 'Kolkota': 'Kolkata', 'Madras': 'Chennai', 'Chenai': 'Chennai',
  'Gurgaon': 'Gurugram', 'Gurgoan': 'Gurugram', 'Allahabad': 'Prayagraj', 'Poona': 'Pune', 'Pune City': 'Pune',
  'Trivandrum': 'Thiruvananthapuram', 'Thiruvanthapuram': 'Thiruvananthapuram', 'TVM': 'Thiruvananthapuram', 'Cochin': 'Kochi',
  'Baroda': 'Vadodara', 'Banaras': 'Varanasi', 'Benares': 'Varanasi', 'Kashi': 'Varanasi', 'Mysore': 'Mysuru', 'Mangalore': 'Mangaluru',
  'Hubli': 'Hubballi', 'Belgaum': 'Belagavi', 'Bellary': 'Ballari', 'Gulbarga': 'Kalaburagi', 'Shimoga': 'Shivamogga', 'Tumkur': 'Tumakuru',
  'Davangere': 'Davanagere', 'Chikmagalur': 'Chikkamagaluru', 'Mercara': 'Madikeri', 'Hospet': 'Hosapete', 'Bijapur': ['Vijayapura', 'Karnataka'],
  'Vizag': 'Visakhapatnam', 'Vishakhapatnam': 'Visakhapatnam', 'Vishakapatnam': 'Visakhapatnam', 'Bezawada': 'Vijayawada', 'Vijaywada': 'Vijayawada',
  'Tirupathi': 'Tirupati', 'Rajamundry': 'Rajahmundry', 'Rajamahendravaram': 'Rajahmundry', 'Masulipatnam': 'Machilipatnam', 'Anantapuramu': 'Anantapur', 'Cuddapah': 'Kadapa',
  'Calicut': 'Kozhikode', 'Trichur': 'Thrissur', 'Quilon': 'Kollam', 'Alleppey': 'Alappuzha', 'Palghat': 'Palakkad', 'Cannanore': 'Kannur', 'Kasargod': 'Kasaragod', 'Tellicherry': 'Thalassery',
  'Trichy': 'Tiruchirappalli', 'Tiruchi': 'Tiruchirappalli', 'Tuticorin': 'Thoothukudi', 'Tanjore': 'Thanjavur', 'Nellai': 'Tirunelveli', 'Tinnevelly': 'Tirunelveli',
  'Kancheepuram': 'Kanchipuram', 'Conjeevaram': 'Kanchipuram', 'Kovai': 'Coimbatore', 'Tirupur': 'Tiruppur', 'Kadalur': 'Cuddalore', 'Cape Comorin': 'Kanyakumari',
  'Mahabubnagar': 'Mahbubnagar', 'Mahbub Nagar': 'Mahbubnagar',
  'Bhubaneshwar': 'Bhubaneswar', 'Bhubneswar': 'Bhubaneswar', 'Bhuvaneswar': 'Bhubaneswar', 'Bhubaneshwer': 'Bhubaneswar', 'Bhubanewar': 'Bhubaneswar', 'BBSR': 'Bhubaneswar', 'Bhubaneswar City': 'Bhubaneswar',
  'Katak': 'Cuttack', 'Rourkella': 'Rourkela', 'Raurkela': 'Rourkela', 'Baleshwar': 'Balasore', 'Baleswar': 'Balasore', 'Balangir': 'Bolangir', 'Baragarh': 'Bargarh', 'Jajapur': 'Jajpur',
  'Panjim': 'Panaji', 'Madgaon': 'Margao', 'Vasco': 'Vasco da Gama', 'Mapuca': 'Mapusa', 'Gauhati': 'Guwahati',
  'Ahemdabad': 'Ahmedabad', 'Ahmadabad': 'Ahmedabad', 'Amdavad': 'Ahmedabad', 'Lakhnau': 'Lucknow', 'Cawnpore': 'Kanpur', 'Bareli': 'Bareilly',
  'Gautam Buddha Nagar': 'Noida', 'Gautam Budh Nagar': 'Noida', 'GB Nagar': 'Noida',
  'Dehra Dun': 'Dehradun', 'Dehradoon': 'Dehradun', 'Hardwar': 'Haridwar', 'Naini Tal': 'Nainital', 'Purnea': 'Purnia', 'Chapra': 'Chhapra', 'Biharsharif': 'Bihar Sharif',
  'Tatanagar': 'Jamshedpur', 'Bokaro': 'Bokaro Steel City', 'Hazaribag': 'Hazaribagh', 'Bhilai Nagar': 'Bhilai', 'Saugor': 'Sagar', 'Narmadapuram': 'Hoshangabad', 'Jubbulpore': 'Jabalpur',
  'SAS Nagar': 'Mohali', 'Sahibzada Ajit Singh Nagar': 'Mohali', 'Bhatinda': 'Bathinda', 'Ropar': 'Rupnagar', 'Ferozepur': 'Firozpur', 'Jullundur': 'Jalandhar',
  'Sonepat': 'Sonipat', 'Yamuna Nagar': 'Yamunanagar', 'Simla': 'Shimla', 'Dharamsala': 'Dharamshala', 'Kulu': 'Kullu',
  'Thana': 'Thane', 'Nasik': 'Nashik', 'Sholapur': 'Solapur', 'Dharashiv': 'Osmanabad', 'Ahmadnagar': 'Ahmednagar', 'Ahilyanagar': 'Ahmednagar',
  'Chhatrapati Sambhajinagar': ['Aurangabad', 'Maharashtra'], 'Sambhajinagar': ['Aurangabad', 'Maharashtra'], 'Amaravati': ['Amravati', 'Maharashtra'],
  'Pimpri Chinchwad': 'Pimpri-Chinchwad', 'PCMC': 'Pimpri-Chinchwad', 'Pimpri': 'Pimpri-Chinchwad', 'Kalyan Dombivli': 'Kalyan', 'Vasai Virar': 'Vasai', 'Mira Road': 'Mira Bhayandar', 'Bhayandar': 'Mira Bhayandar', 'Mira-Bhayandar': 'Mira Bhayandar',
  'Lonavla': 'Lonavala', 'Alibaug': 'Alibag', 'Gondiya': 'Gondia', 'Buldana': 'Buldhana', 'Nanded Waghala': 'Nanded',
  'Delhi NCR': 'Delhi', 'Dilli': 'Delhi', 'NCT Delhi': 'Delhi',
  'Jaipur City': 'Jaipur', 'Chandigarh City': 'Chandigarh', 'CHD': 'Chandigarh', 'Hyderabad City': 'Hyderabad',
  'Pondicherry': 'Puducherry', 'Pondichery': 'Puducherry',
  // Hindi / Devanagari
  'दिल्ली': 'Delhi', 'नई दिल्ली': 'New Delhi', 'मुंबई': 'Mumbai', 'जयपुर': 'Jaipur', 'लखनऊ': 'Lucknow', 'पटना': 'Patna', 'भोपाल': 'Bhopal', 'इंदौर': 'Indore',
  'कानपुर': 'Kanpur', 'वाराणसी': 'Varanasi', 'आगरा': 'Agra', 'नोएडा': 'Noida', 'गुरुग्राम': 'Gurugram', 'चंडीगढ़': 'Chandigarh', 'अहमदाबाद': 'Ahmedabad', 'रायपुर': 'Raipur',
  'रांची': 'Ranchi', 'कोटा': 'Kota', 'जैसलमेर': 'Jaisalmer', 'गाजियाबाद': 'Ghaziabad', 'जोधपुर': 'Jodhpur', 'उदयपुर': ['Udaipur', 'Rajasthan'], 'अजमेर': 'Ajmer', 'पुणे': 'Pune', 'नागपुर': 'Nagpur',
  'यमुनानगर': 'Yamunanagar', 'करनाल': 'Karnal', 'सहरसा': 'Saharsa', 'नागौर': 'Nagaur', 'ग्वालियर': 'Gwalior', 'जबलपुर': 'Jabalpur', 'प्रयागराज': 'Prayagraj', 'देहरादून': 'Dehradun',
  // spellings seen in real profiles (each one checked by hand; a wrong guess is worse than no guess, so nothing here is computed)
  'Ambernath': 'Ambarnath', 'Deogrh': 'Deogarh', 'Thiruvanathapuram': 'Thiruvananthapuram', 'Gorkhpur': 'Gorakhpur', 'Gawlior': 'Gwalior', 'Jamsedpur': 'Jamshedpur',
  'Dehli': 'Delhi', 'Dilhi': 'Delhi', 'Khorda': 'Khordha', 'Sibsagar': 'Sivasagar', 'Shivsagar': 'Sivasagar', 'Sibsagarh': 'Sivasagar', 'Belgavi': 'Belagavi',
  'Chikkaballapura': 'Chikkaballapur', 'Hanuman ghar': 'Hanumangarh', 'Luccknow': 'Lucknow', 'Lukhnow': 'Lucknow', 'Vadodhra': 'Vadodara', 'Varodra': 'Vadodara', 'Vadodra': 'Vadodara',
  'Hyderbad': 'Hyderabad', 'Hydrabad': 'Hyderabad', 'Mehasana': 'Mehsana', 'Mahesana': 'Mehsana', 'Siligiri': 'Siliguri', 'Reshikesh': 'Rishikesh', 'Muzaffarapur': 'Muzaffarpur',
  'Prayagaraj': 'Prayagraj', 'Pryagraj': 'Prayagraj', 'Prayraj': 'Prayagraj', 'Praygraj': 'Prayagraj', 'Pregraj': 'Prayagraj', 'Thruissur': 'Thrissur', 'Yammunanagar': 'Yamunanagar',
  'Mandsour': 'Mandsaur', 'Jagityal': 'Jagtial', 'Kollkata': 'Kolkata', 'Kotdwara': 'Kotdwar', 'Serampure': 'Serampore', 'Secundrabad': 'Secunderabad', 'Secderabad': 'Secunderabad',
  'Gurgram': 'Gurugram', 'Badaun': 'Budaun', 'Badayun': 'Budaun', 'Nabarangapur': 'Nabarangpur',
  'Bengalore': 'Bengaluru', 'Benglore': 'Bengaluru', 'Bangluru': 'Bengaluru', 'Bnagalore': 'Bengaluru', 'Banaglore': 'Bengaluru', 'Bangalor': 'Bengaluru', 'Bangalore South': 'Bengaluru',
  'Manglore': 'Mangaluru', 'Shilong': 'Shillong', 'Shiillong': 'Shillong', 'Malegone': 'Malegaon', 'Jagatshingpur': 'Jagatsinghpur', 'Jagatsinghapur': 'Jagatsinghpur', 'Jeypure': 'Jeypore',
  'Kozhikkod': 'Kozhikode', 'Calicat': 'Kozhikode', 'Shri Ganganagar': 'Sri Ganganagar', 'Shriganganagar': 'Sri Ganganagar', 'Sriganganagar': 'Sri Ganganagar', 'Ratangri': 'Ratnagiri',
  'Ahmedabd': 'Ahmedabad', 'Ahmdabad': 'Ahmedabad', 'Vijayapur': ['Vijayapura', 'Karnataka'], 'Shivamoga': 'Shivamogga', 'Muradabad': 'Moradabad',
  'Gaziabad': 'Ghaziabad', 'Gaziyabad': 'Ghaziabad', 'Ghaziabaad': 'Ghaziabad', 'Bardhman': 'Bardhaman', 'Jamnu': 'Jammu', 'Chithoor': 'Chittoor', 'Barrilly': 'Bareilly', 'Patana': 'Patna',
  'Kottyam': 'Kottayam', 'Yavatamal': 'Yavatmal', 'Siker': 'Sikar', 'Ayodhaya': 'Ayodhya', 'Jhunjhunun': 'Jhunjhunu', 'Indor': 'Indore', 'Deradhun': 'Dehradun', 'Dheradun': 'Dehradun',
  'Nort Lakhimpur': 'North Lakhimpur', 'Nogaon': 'Nagaon', 'Mumba': 'Mumbai', 'Chattarpur': 'Chhatarpur', 'Visakhapatanam': 'Visakhapatnam', 'Vishakapatnm': 'Visakhapatnam',
  'Bhavanagar': 'Bhavnagar', 'Chandighar': 'Chandigarh', 'Jaislemer': 'Jaisalmer', 'Miriyalaguda': 'Miryalaguda', 'Bulandshar': 'Bulandshahr', 'Bulandshahar': 'Bulandshahr', 'Alibagh': 'Alibag',
  'Sharanpur': ['Saharanpur', 'Uttar Pradesh'], 'Fathepur': ['Fatehpur', 'Uttar Pradesh'], 'Chaundaus': 'Chandausi', 'Gr Noida': 'Greater Noida', 'Berpeta': 'Barpeta', 'Bimivaram': 'Bhimavaram',
  'Jhajjer': 'Jhajjar', 'Chittorgher': 'Chittorgarh', 'Kanpur Nagar': 'Kanpur', 'Bhuvneshwar': 'Bhubaneswar', 'Bhubaneshwar': 'Bhubaneswar', 'Nimuch': 'Neemuch', 'Hydrabad City': 'Hyderabad',
  'Pratapgrh': 'Pratapgarh', 'Thiruvallur': 'Tiruvallur', 'Mahendargarh': 'Mahendragarh', 'Nandyala': 'Nandyal', 'Karouli': 'Karauli', 'Karuali': 'Karauli', 'Kapdwanj': 'Kapadvanj',
  'Narsingpur': ['Narsinghpur', 'Madhya Pradesh'], 'Doddaballpur': 'Doddaballapur', 'Nawanshahar': 'Nawanshahr', 'Rayachoty': 'Rayachoti', 'Harippad': 'Haripad', 'Tiruvalla': 'Thiruvalla',
  'Sahdol': 'Shahdol', 'Mandala': ['Mandla', 'Madhya Pradesh'], 'Fathpur': ['Fatehpur', 'Rajasthan'], 'Proddutur': 'Proddatur', 'Naharkatiya': 'Naharkatia', 'Mugalsarai': 'Mughalsarai',
  'Gaya Ji': 'Gaya', 'Mumbai 70': 'Mumbai', 'Siddharth Nagar': 'Siddharthnagar',
  'Chhtrapati Sambhajinagar': ['Aurangabad', 'Maharashtra'], 'Chhatarpati Sambhaji Nagar': ['Aurangabad', 'Maharashtra'], 'Chatrapati Sambhaji Nagar': ['Aurangabad', 'Maharashtra'],
  'Sanbhaji Nagar': ['Aurangabad', 'Maharashtra'], 'Aurangabad Sambhajinagar': ['Aurangabad', 'Maharashtra'], 'Aurngabad': ['Aurangabad', 'Maharashtra'],
};

// ─── matching helpers ────────────────────────────────────────────────────────
// A "key" is a name boiled down for comparing: no capitals, spaces, dots, dashes
// or accents, "&" read as "and". "Tamil Nadu", "tamilnadu" and "TAMIL NADU." all
// give the same key.
const normKey = (s) => String(s == null ? '' : s)
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/&/g, ' and ').replace(/[^\p{L}\p{M}\p{N}]+/gu, '');

const STATES = Object.keys(INDIA_LOCATIONS).sort((a, b) => a.localeCompare(b));

// state key -> official name (official names first, then the aliases)
const STATE_KEYS = new Map();
STATES.forEach((s) => STATE_KEYS.set(normKey(s), s));
const STATE_ALIAS_KEYS = new Map();
Object.entries(STATE_ALIASES).forEach(([alias, official]) => STATE_ALIAS_KEYS.set(normKey(alias), official));

// per state: city key -> official city name;  and a global list for "which state is this city in"
const CITY_KEYS = {};
const CITY_STATES = new Map(); // city key -> [{ city, state }]
STATES.forEach((state) => {
  CITY_KEYS[state] = new Map();
  INDIA_LOCATIONS[state].forEach((city) => {
    CITY_KEYS[state].set(normKey(city), city);
    const k = normKey(city);
    if (!CITY_STATES.has(k)) CITY_STATES.set(k, []);
    CITY_STATES.get(k).push({ city, state });
  });
});
const CITY_ALIAS_KEYS = new Map(); // alias key -> { city, state|null }
Object.entries(CITY_ALIASES).forEach(([alias, target]) => {
  const [city, state] = Array.isArray(target) ? target : [target, null];
  CITY_ALIAS_KEYS.set(normKey(alias), { city, state });
});

// small words people add: "Pune City", "Bengaluru Urban", "Mumbai District", "Gurgaon NCR"
const stripNoise = (key, words) => {
  for (const w of words) if (key.length > w.length + 2 && key.endsWith(w)) return key.slice(0, -w.length);
  return key;
};
const stateVariantsOfKey = (key) => [key, stripNoise(key, ['india', 'state', 'ut'])];
const cityVariantsOfKey = (key) => [key, stripNoise(key, ['city', 'urban', 'district', 'dist', 'ncr', 'india'])];

// edit distance where swapping two neighbouring letters counts as one mistake
const distance = (a, b) => {
  if (a === b) return 0;
  const m = a.length; const n = b.length;
  if (!m || !n) return Math.max(m, n);
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
};
// how many mistakes are allowed in a name of this length (short names must be exact)
const allowedMistakes = (len) => (len <= 3 ? 0 : len <= 6 ? 1 : 2);

// the one closest candidate, or null when there is none close enough or two are equally close
const closest = (key, candidates) => {
  const limit = allowedMistakes(key.length);
  if (!limit) return null;
  let best = null; let bestD = Infinity; let tie = false;
  for (const c of candidates) {
    if (Math.abs(c.key.length - key.length) > limit) continue;
    const dist = distance(key, c.key);
    if (dist > limit) continue;
    if (dist < bestD) { best = c; bestD = dist; tie = false; } else if (dist === bestD && c.value !== best.value) tie = true;
  }
  return best && !tie ? best : null;
};
const STATE_CANDIDATES = STATES.map((s) => ({ key: normKey(s), value: s }));

// ─── resolving a typed name ──────────────────────────────────────────────────
// → { value, method } with method 'exact' | 'alias' | 'fuzzy', or null
const resolveState = (text, { allowFuzzy = true } = {}) => {
  const key = normKey(text);
  if (!key) return null;
  for (const k of stateVariantsOfKey(key)) {
    if (STATE_KEYS.has(k)) return { value: STATE_KEYS.get(k), method: 'exact' };
    if (STATE_ALIAS_KEYS.has(k)) return { value: STATE_ALIAS_KEYS.get(k), method: 'alias' };
  }
  // the same name typed twice: "RajasthanRajasthan"
  if (key.length >= 8 && key.length % 2 === 0 && key.slice(0, key.length / 2) === key.slice(key.length / 2)) {
    const half = resolveState(key.slice(0, key.length / 2), { allowFuzzy: false });
    if (half && half.method === 'exact') return { value: half.value, method: 'alias' };
  }
  if (allowFuzzy) {
    const hit = closest(key, STATE_CANDIDATES);
    if (hit) return { value: hit.value, method: 'fuzzy' };
  }
  return null;
};

// words in the state box that mean "somewhere that is not India": the city is then left exactly as typed
const FOREIGN = new Set(['uae', 'unitedarabemirates', 'dubai', 'usa', 'unitedstates', 'us', 'england', 'unitedkingdom', 'london', 'canada', 'australia', 'nepal', 'bangladesh',
  'dhaka', 'dhak', 'pakistan', 'srilanka', 'bahrain', 'saudiarabia', 'sadui', 'qatar', 'oman', 'kuwait', 'singapore', 'malaysia', 'china', 'guangdong', 'germany', 'france', 'bhutan', 'maldives']);

// With a state: look inside that state. Without one: look in every state.
// → { value, state, method, states } | null.  `states` lists every state that has
// a city of this name; when there is more than one the name is ambiguous (state = '').
const resolveCity = (text, stateValue = '', { allowFuzzy = true } = {}) => {
  const key = normKey(text);
  if (!key) return null;
  const keys = cityVariantsOfKey(key);

  if (stateValue && CITY_KEYS[stateValue]) {
    const own = CITY_KEYS[stateValue];
    for (const k of keys) {
      if (own.has(k)) return { value: own.get(k), state: stateValue, method: 'exact', states: [stateValue] };
      const al = CITY_ALIAS_KEYS.get(k);
      if (al && (!al.state || al.state === stateValue) && own.has(normKey(al.city))) return { value: own.get(normKey(al.city)), state: stateValue, method: 'alias', states: [stateValue] };
    }
    if (allowFuzzy) {
      const hit = closest(key, [...own.entries()].map(([k, v]) => ({ key: k, value: v })));
      if (hit) return { value: hit.value, state: stateValue, method: 'fuzzy', states: [stateValue] };
    }
    return null;
  }

  for (const k of keys) {
    const direct = CITY_STATES.get(k);
    if (direct) return fromPlaces(direct, 'exact');
    const al = CITY_ALIAS_KEYS.get(k);
    if (al) {
      const places = (CITY_STATES.get(normKey(al.city)) || []).filter((p) => !al.state || p.state === al.state);
      if (places.length) return fromPlaces(places, 'alias');
    }
  }
  if (allowFuzzy && key.length >= 6) {
    const all = [];
    CITY_STATES.forEach((places, k) => all.push({ key: k, value: places[0].city, places }));
    const hit = closest(key, all);
    if (hit) return fromPlaces(hit.places, 'fuzzy');
  }
  return null;
};
const fromPlaces = (places, method) => {
  const states = [...new Set(places.map((p) => p.state))];
  return { value: places[0].city, state: states.length === 1 ? states[0] : '', method, states };
};

// ─── tidy-up of text we could not match ──────────────────────────────────────
const tidy = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').replace(/^[\s,.;:\-]+|[\s,;:\-]+$/g, '').trim();
const titleIfShouting = (s) => {
  if (!s || (s !== s.toLowerCase() && s !== s.toUpperCase())) return s;
  return s.toLowerCase().replace(/(^|[\s\-'])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
};

// ─── the one function the clean-up script uses ───────────────────────────────
// Takes what is saved today and says what it should become.
//   status: 'empty'      nothing saved
//           'ok'         already the official spelling
//           'fixed'      state and/or city changed to the official name
//           'kept-city'  state is fine; the city is not in our list so it stays as typed
//                        (it works as "My city is not listed")
//           'conflict'   the city is in our list but under a different state - nothing guessed
//           'unmatched'  could not be matched at all - left exactly as it is
const fixLocation = (loc) => {
  const original = { city: loc && loc.city != null ? String(loc.city) : '', state: loc && loc.state != null ? String(loc.state) : '' };
  let city = tidy(original.city);
  let state = tidy(original.state);
  const notes = [];

  if (!city && !state) return { status: 'empty', city: original.city, state: original.state, changed: false, notes };

  // "Mumbai, Maharashtra" typed into the city box
  if (/[,/|]|\s-\s/.test(city)) {
    const parts = city.split(/\s*(?:,|\/|\||\s-\s)\s*/).filter(Boolean);
    const last = parts[parts.length - 1];
    const lastState = parts.length >= 2 ? resolveState(last, { allowFuzzy: false }) : null;
    if (lastState && (!state || (resolveState(state) || {}).value === lastState.value)) {
      city = parts.slice(0, -1).join(', ');
      if (!state) state = lastState.value;
      notes.push('state was written inside the city');
    } else if (parts.length >= 2 && normKey(last) === 'india') {
      city = parts.slice(0, -1).join(', ');
    }
  }

  // "Jalandhar Punjab", "North Lakhimpur Assam India": the state and/or "India" written after the city, no comma
  for (let guard = 0; guard < 4; guard += 1) {
    const words = city.split(/\s+/);
    if (words.length < 2) break;
    let cut = 0; let tailState = null;
    for (const n of [3, 2, 1]) {
      if (words.length <= n) continue;
      const tail = words.slice(-n).join(' ');
      if (normKey(tail) === 'india') { cut = n; break; }
      const st = resolveState(tail, { allowFuzzy: false });
      if (st) { cut = n; tailState = st; break; }
    }
    if (!cut) break;
    const base = words.slice(0, -cut).join(' ');
    if (tailState) {
      // only when the rest is a city we know, and the state agrees with what was typed (or nothing was typed)
      const typed = state ? resolveState(state, { allowFuzzy: false }) : null;
      if (typed && typed.value !== tailState.value) break;
      if (!resolveCity(base, tailState.value, { allowFuzzy: false })) break;
      if (!state) state = tailState.value;
      notes.push('state was written after the city');
    }
    city = base;
  }

  // a typed state that is really a city or district ("Pune", "Hanumangarh") says which state it means
  // only when that name belongs to one state; it must never be fuzzy-matched into a state
  const stateAsCity = state ? resolveCity(state, '', { allowFuzzy: false }) : null;
  const stateHit = state ? resolveState(state, { allowFuzzy: !stateAsCity }) : null;
  let cityHit = null;
  let finalState = stateHit ? stateHit.value : '';
  let finalCity;
  let status;
  let stateMethod = stateHit ? stateHit.method : '';
  let cityMethod = '';

  if (stateHit) {
    cityHit = city ? resolveCity(city, finalState, { allowFuzzy: false }) : null;
    if (cityHit) {
      finalCity = cityHit.value; cityMethod = cityHit.method; status = 'fixed';
    } else if (!city) {
      finalCity = ''; status = 'fixed';
    } else {
      const elsewhere = resolveCity(city, '', { allowFuzzy: false });
      if (elsewhere && elsewhere.states.length && !elsewhere.states.includes(finalState)) {
        finalCity = titleIfShouting(city); status = 'conflict';
        notes.push(`city "${elsewhere.value}" is in ${elsewhere.states.join(' / ')}, not ${finalState}`);
      } else if (['uk', 'la'].includes(normKey(state))) {
        // "UK" / "LA" are Uttarakhand's / Ladakh's short codes but also the United Kingdom / Los Angeles:
        // with a city we do not know we do not guess
        return { status: 'unmatched', city: original.city, state: original.state, changed: false, notes: [`"${state}" could mean an Indian state or another country, and the city is not in our list`] };
      } else {
        finalCity = titleIfShouting(city); status = 'kept-city';
        notes.push('city is not in our list');
      }
    }
  } else {
    // no usable state: let the city decide it, but only when the city belongs to one state
    if (FOREIGN.has(normKey(state))) return { status: 'unmatched', city: original.city, state: original.state, changed: false, notes: ['looks like a place outside India'] };
    cityHit = city ? resolveCity(city, '', { allowFuzzy: false }) : null;
    const districtState = stateAsCity && stateAsCity.state ? stateAsCity.state : '';
    if (cityHit && cityHit.state && districtState && districtState !== cityHit.state) {
      // the state box holds a city of another state ("Shillong" / "Mathura"): we cannot tell which one is meant
      return { status: 'conflict', city: original.city, state: original.state, changed: false, notes: [`city "${cityHit.value}" is in ${cityHit.state}, but the state box says "${stateAsCity.value}" which is in ${districtState}`] };
    }
    if (cityHit && cityHit.state) {
      finalState = cityHit.state; finalCity = cityHit.value; cityMethod = cityHit.method; stateMethod = state ? 'from-city (typed state not recognised)' : 'from-city';
      status = 'fixed';
    } else if (city && state && resolveState(city, { allowFuzzy: false }) && resolveCity(state, resolveState(city, { allowFuzzy: false }).value, { allowFuzzy: false })) {
      // the two boxes were filled the wrong way round: city "Odisha", state "Bhubaneswar"
      finalState = resolveState(city, { allowFuzzy: false }).value;
      const swapped = resolveCity(state, finalState, { allowFuzzy: false });
      finalCity = swapped.value; cityMethod = swapped.method; stateMethod = 'exact';
      status = 'fixed'; notes.push('city and state were the wrong way round');
    } else if (city && !cityHit && !FOREIGN.has(normKey(state)) && (() => {
      const h = resolveState(city);
      return h && (h.method === 'exact' || (h.method === 'alias' && normKey(city).length >= 5) || (h.method === 'fuzzy' && normKey(city).length >= 6));
    })()) {
      // a state name (maybe misspelt) in the city box and something else (a district, a town, "India") in the state box
      const cityAsState = resolveState(city);
      const junk = !state || ['india', 'state', 'country', 'na', 'none'].includes(normKey(state));
      finalState = cityAsState.value; stateMethod = 'from the city box';
      finalCity = junk ? titleIfShouting(city) : titleIfShouting(state);
      status = 'fixed'; notes.push(junk ? 'the state was typed in the city box' : 'the state was typed in the city box and the town in the state box');
    } else if (districtState) {
      // "Nohar" / "Hanumangarh": the state box holds a city or district that belongs to only one state
      const inState = city ? resolveCity(city, districtState, { allowFuzzy: false }) : null;
      finalState = districtState; stateMethod = 'from the district in the state box';
      finalCity = inState ? inState.value : titleIfShouting(city);
      if (inState) cityMethod = inState.method;
      status = 'fixed'; notes.push(`the state box held "${stateAsCity.value}"`);
    } else {
      const reason = !state ? 'no state' : 'state not recognised';
      return { status: 'unmatched', city: original.city, state: original.state, changed: false, notes: [reason + (cityHit && !cityHit.state ? ', city name exists in several states' : '')] };
    }
  }

  const changed = finalCity !== original.city || finalState !== original.state;
  if (status === 'fixed' && !changed) status = 'ok';
  return { status, city: finalCity, state: finalState, changed, cityMethod, stateMethod, notes };
};

// ─── "are we sure about this location?" ──────────────────────────────────────
// Used by the clean-up script (to decide who gets the "please set your location"
// pop-up) and by the pop-up's own save (to accept only a proper location).

// big cities of other countries that people type next to an Indian state name
// ("Rawalpindi" / "Punjab"): we cannot tell where they really are
const FOREIGN_CITIES = new Set(['lahore', 'karachi', 'rawalpindi', 'islamabad', 'faisalabad', 'multan', 'peshawar', 'quetta', 'nankanasahib', 'kathmandu', 'pokhara', 'dhaka', 'chittagong', 'khulna',
  'colombo', 'kabul', 'abudhabi', 'sharjah', 'riyadh', 'jeddah', 'doha', 'muscat', 'manama', 'toronto', 'sydney', 'melbourne', 'newyork', 'newyorkcity', 'losangeles', 'paris', 'berlin', 'lima']);
// words that are never a city name
const NOT_A_CITY = new Set(['india', 'indian', 'bharat', 'ncr', 'all', 'na', 'none', 'null', 'nil', 'state', 'city', 'country', 'other', 'others', 'abc', 'xyz', 'unknown', 'test', 'testing', 'demo', 'mukhyamantri', 'chatting']);
// 3-letter towns that really exist (anything else this short is a typo or a code)
const SHORT_TOWNS = new Set(['ara', 'bir', 'amb']);
const JUNK_WORDS = /\b(select|district|dist|tehsil|tahsil|block|college|university|school|apartment|apartments|road|street|colony|society|po|s\.o|p\.o)\b/i;

// '' when the text could be a real city / town / area; otherwise why it is not
const plausibleCity = (text) => {
  const t = tidy(text);
  const k = normKey(t);
  if (!k) return 'no city';
  // a state name, also with a typo ("Uttrakhand"); a short name must match exactly
  const asState = resolveState(t);
  if (asState && (asState.method !== 'fuzzy' || (k.length >= 8 && k[0] === normKey(asState.value)[0]))) return 'is a state name, not a city';
  const letters = (t.match(/\p{L}/gu) || []).length;
  if (letters < 3 || (letters === 3 && !SHORT_TOWNS.has(k))) return 'too short to be a city';
  if (/\d/.test(t)) return 'has numbers in it';
  if (/[,;/&|()@]|\s-\s/.test(t) || /\s(?:and|or)\s/i.test(t)) return 'more than one place written together';
  if (t.split(/\s+/).length >= 5) return 'looks like an address';
  if (JUNK_WORDS.test(t)) return 'not a city name';
  if (NOT_A_CITY.has(k)) return 'not a city name';
  if (FOREIGN.has(k) || FOREIGN_CITIES.has(k)) return 'a place outside India';
  return '';
};

// What to do with one saved location, given what fixLocation() said about it.
//   verdict 'ok'      nothing to do
//           'write'   we are sure: change it to the official spelling
//           'review'  we are not sure: leave it and ask the person (reason says why)
//   group   'nomatch' | 'conflict' | 'unclear'  (for the report)
// A result that came from a hand-checked override (r.via) is always trusted.
const TRUSTED_CODES = new Set(['mp', 'up', 'hp', 'tn', 'wb', 'ap', 'jk']);
const assessResult = (r, typed) => {
  if (!r) return { verdict: 'review', group: 'nomatch', reason: 'no location' };
  const reason = (r.notes && r.notes[0]) || '';
  if (r.status === 'empty') return { verdict: 'review', group: 'nomatch', reason: 'no location saved' };
  if (r.status === 'unmatched') return { verdict: 'review', group: 'nomatch', reason: reason || 'could not be matched' };
  if (r.status === 'conflict') return { verdict: 'review', group: 'conflict', reason };
  if (r.status === 'ok') return { verdict: 'ok', reason: '' };
  // 'fixed' or 'kept-city': the state is known; the city must be either in our list or a believable name
  if (!r.via && !r.cityMethod) {
    const why = plausibleCity(r.city);
    if (why) return { verdict: 'review', group: 'unclear', reason: `city ${why}` };
    // a town we do not know plus a 2-letter state code: only the well-known codes are trusted
    const stateKey = typed ? normKey(typed.state) : '';
    if (stateKey.length <= 2 && !TRUSTED_CODES.has(stateKey)) return { verdict: 'review', group: 'unclear', reason: `the state "${typed.state}" is only a short code` };
  }
  return { verdict: r.changed ? 'write' : 'ok', reason: '' };
};

// The pop-up's save: only a state from the list plus a real city is accepted.
// → { ok, city, state } or { ok:false, message }
const checkPickedLocation = (cityText, stateText) => {
  const st = resolveState(stateText, { allowFuzzy: false });
  if (!st) return { ok: false, message: 'Please select your state from the list' };
  const c = tidy(cityText);
  if (!c) return { ok: false, message: 'Please select your city' };
  const inList = resolveCity(c, st.value, { allowFuzzy: false });
  if (inList) return { ok: true, city: inList.value, state: st.value };
  // "My city is not listed": the same rule as the form (letters and spaces)
  if (c.length < 2 || c.length > 60 || !/^[A-Za-z][A-Za-z .'\-]*$/.test(c)) return { ok: false, message: 'City name can only have letters and spaces' };
  if (plausibleCity(c)) return { ok: false, message: 'Please type the name of your city or town' };
  const elsewhere = resolveCity(c, '', { allowFuzzy: false });
  if (elsewhere && elsewhere.states.length && !elsewhere.states.includes(st.value)) {
    return { ok: false, message: `${elsewhere.value} is in ${elsewhere.states.join(' / ')}, not ${st.value}. Please check your state and city` };
  }
  return { ok: true, city: titleIfShouting(c), state: st.value };
};

// Someone who lives outside India: a city and a country, typed. A country that is
// really an Indian state is refused (they should pick it from the list instead).
const checkOutsideLocation = (cityText, countryText) => {
  const city = tidy(cityText); const country = tidy(countryText);
  const okText = (s) => s.length >= 2 && s.length <= 60 && /^\p{L}[\p{L} .'\-]*$/u.test(s);
  if (!okText(city)) return { ok: false, message: 'Please type your city (letters and spaces only)' };
  if (!okText(country)) return { ok: false, message: 'Please type your country (letters and spaces only)' };
  if (resolveState(country, { allowFuzzy: false }) || ['india', 'bharat', 'hindustan'].includes(normKey(country))) {
    return { ok: false, message: 'If you live in India, please pick your state and city from the lists' };
  }
  // short country names (UAE, USA, UK) stay in capitals
  return { ok: true, city: titleIfShouting(city), state: country.length <= 3 ? country.toUpperCase() : titleIfShouting(country) };
};

// ─── searching ───────────────────────────────────────────────────────────────
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// every spelling we accept for an official name: Mumbai -> Mumbai, Bombay, Greater Mumbai ...
const variantsOf = (type, official) => {
  const table = type === 'state' ? STATE_ALIASES : CITY_ALIASES;
  const out = new Set([official]);
  Object.entries(table).forEach(([alias, target]) => {
    if ((Array.isArray(target) ? target[0] : target) === official) out.add(alias);
  });
  return [...out];
};

// What to look for when someone searches for `text`. → { official, variants }
// `official` is '' when we do not recognise it (then only the typed text is used).
const lookupPlace = (type, text, stateText = '') => {
  const typed = tidy(text);
  if (!typed) return { official: '', variants: [] };
  let official = '';
  if (type === 'state') {
    const hit = resolveState(typed);
    official = hit ? hit.value : '';
  } else {
    const stateHit = stateText ? resolveState(stateText) : null;
    const hit = resolveCity(typed, stateHit ? stateHit.value : '');
    official = hit ? hit.value : '';
  }
  const variants = official ? variantsOf(type, official) : [];
  if (!variants.some((v) => normKey(v) === normKey(typed))) variants.push(typed);
  return { official, variants };
};

// A database regex source that matches a whole saved value, ignoring capitals and
// stray spaces, for any of the given spellings. Use with $options: 'i'.
const wholeValueRegex = (variants) => `^\\s*(?:${variants.map(escapeRegex).join('|')})\\s*$`;
// Same, but the spelling may appear anywhere inside the text (used for free text).
// Very short alternative names (codes like "MH", "AS") are left out here, because
// inside a longer text they would match by accident ("AS" is inside "Rajasthan").
const looseRegex = (variants) => `(?:${variants.filter((v, i) => i === 0 || v.length >= 4).map(escapeRegex).join('|')})`;

// do two typed names mean the same place? ("Bombay" and "mumbai")
const samePlace = (a, b) => {
  const ka = normKey(a); const kb = normKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  const ra = resolveCity(a, '', { allowFuzzy: false }); const rb = resolveCity(b, '', { allowFuzzy: false });
  return !!(ra && rb && ra.value === rb.value);
};

module.exports = {
  INDIA_LOCATIONS, STATES, STATE_ALIASES, CITY_ALIASES,
  normKey, resolveState, resolveCity, fixLocation, plausibleCity, assessResult, checkPickedLocation, checkOutsideLocation, variantsOf, lookupPlace, wholeValueRegex, looseRegex, escapeRegex, samePlace, tidy,
};
