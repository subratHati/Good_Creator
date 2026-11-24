// States, union territories and their main cities, so a brand picks its
// location from a list instead of typing it (and misspelling it).
// If a city is missing, the picker lets the brand type it ("My city is not listed").

export const INDIA_LOCATIONS = {
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

export const STATES = Object.keys(INDIA_LOCATIONS).sort((a, b) => a.localeCompare(b));

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

// "Tamil Nadu", "tamilnadu" and "TAMIL NADU." are the same name: no capitals, spaces, dots, dashes or accents
const normKey = (s) => String(s == null ? '' : s)
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/&/g, ' and ').replace(/[^\p{L}\p{M}\p{N}]+/gu, '');
const stripNoise = (key, words) => {
  for (const w of words) if (key.length > w.length + 2 && key.endsWith(w)) return key.slice(0, -w.length);
  return key;
};

const STATE_KEYS = new Map(STATES.map((s) => [normKey(s), s]));
const STATE_ALIAS_KEYS = new Map(Object.entries(STATE_ALIASES).map(([a, o]) => [normKey(a), o]));
const CITY_ALIAS_KEYS = new Map(Object.entries(CITY_ALIASES).map(([a, t]) => [normKey(a), Array.isArray(t) ? { city: t[0], state: t[1] } : { city: t, state: null }]));

// "maharashtra", "Orissa", "MH" -> the official name. Returns '' when it is not a state in the list.
export const matchState = (value) => {
  const key = normKey(value);
  if (!key) return '';
  for (const k of [key, stripNoise(key, ['india', 'state', 'ut'])]) {
    if (STATE_KEYS.has(k)) return STATE_KEYS.get(k);
    if (STATE_ALIAS_KEYS.has(k)) return STATE_ALIAS_KEYS.get(k);
  }
  return '';
};

// "pune", "Bombay" in "Maharashtra" -> "Pune" / "Mumbai". Returns '' when it is not in that state's list.
export const matchCity = (state, value) => {
  const s = matchState(state);
  const list = INDIA_LOCATIONS[s] || [];
  const key = normKey(value);
  if (!s || !key) return '';
  for (const k of [key, stripNoise(key, ['city', 'urban', 'district', 'dist', 'ncr', 'india'])]) {
    const hit = list.find((c) => normKey(c) === k);
    if (hit) return hit;
    const alias = CITY_ALIAS_KEYS.get(k);
    if (alias && (!alias.state || alias.state === s) && list.includes(alias.city)) return alias.city;
  }
  return '';
};

// The state a city belongs to, only when that is certain (the city is in exactly one state).
export const stateOfCity = (value) => {
  const key = normKey(value);
  if (!key) return '';
  const found = new Set();
  for (const k of [key, stripNoise(key, ['city', 'urban', 'district', 'dist', 'ncr', 'india'])]) {
    const alias = CITY_ALIAS_KEYS.get(k);
    const official = alias ? normKey(alias.city) : k;
    STATES.forEach((s) => { if (alias && alias.state && alias.state !== s) return; if (INDIA_LOCATIONS[s].some((c) => normKey(c) === official)) found.add(s); });
    if (found.size) break;
  }
  return found.size === 1 ? [...found][0] : '';
};

// Tidy up a saved location so the pickers can show it.
export const normalizeLocation = (state, city) => {
  const s = matchState(state);
  if (!s) return { state: String(state || '').trim(), city: String(city || '').trim() };
  return { state: s, city: matchCity(s, city) || String(city || '').trim() };
};

// A city typed by hand ("My city is not listed"): letters, spaces and . ' -
export const cityTextProblem = (value) => {
  const s = String(value || '').trim();
  if (s.length < 2) return 'Please type your city name';
  if (s.length > 60 || !/^[A-Za-z][A-Za-z .'\-]*$/.test(s)) return 'City name can only have letters and spaces';
  return '';
};

// Returns a message, or '' when the location is fine.
export const locationProblem = (state, city) => {
  if (!matchState(state)) return 'Please select your state from the list';
  if (!String(city || '').trim()) return 'Please select your city';
  if (!matchCity(state, city)) return cityTextProblem(city);
  return '';
};
