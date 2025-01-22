import pdfplumber
import spacy
from flask import Flask, request, jsonify
import os
import re

# Initialize the Flask app
app = Flask(__name__)

# Load the spaCy model
try:
    nlp = spacy.load("en_core_web_lg")
except Exception as e:
    print(f"Error loading spaCy model: {e}")
    nlp = None  # Prevent proceeding without the model

# Function to extract text from PDF
def extract_text_from_pdf(pdf_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text()
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

# Function to extract entities (Name, Phone Number, Address) using spaCy
def extract_entities(text):
    try:
        if not nlp:
            raise Exception("spaCy model is not loaded.")

        doc = nlp(text)
        name = ""
        phone_number = ""
        address = ""
        role = ""

        # Print entities detected by spaCy
        print("Entities found:", [(ent.text, ent.label_) for ent in doc.ents])

        # Extract possible name (fallback using regex)
        possible_names = [ent.text for ent in doc.ents if ent.label_ in ["PERSON"]]
        if possible_names:
            name = possible_names[0]
        else:
            # Simple regex for names (basic fallback)
            name_match = re.search(r"Name\s*:\s*([A-Za-z\s]+)", text)
            if name_match:
                name = name_match.group(1).strip()

        # Extract phone number using regex
        phone_match = re.search(r"Phone\s*:\s*(\+?\d{1,3}[-.\s]?\(?\d{2,3}\)?[-.\s]?\d{3}[-.\s]?\d{4})", text)
        if phone_match:
            phone_number = phone_match.group(1).strip()

        # Extract address using regex
        address_match = re.search(r"Address\s*:\s*([\w\s,.-]+)", text)
        if address_match:
            address = address_match.group(1).strip()

        # Extract role using regex
        role_match = re.search(r"Role\s*:\s*([\w\s]+)", text)
        if role_match:
            role = role_match.group(1).strip()

        return {"name": name, "phone_number": phone_number, "address": address, "role": role}
    except Exception as e:
        print(f"Error extracting entities: {e}")
        return None


# Route to handle file upload and data extraction
@app.route('/extract', methods=['POST'])
def extract_data():
    try:
        print("Received a request to extract data from a PDF file.", request)
        
        # Check if a file is provided in the request
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        
        # Log file details
        print(f"Received file: {file.filename}")
        print(f"File content type: {file.content_type}")
        print(f"File size: {len(file.read())} bytes")  # Read and print the file size (in bytes)
        
        # Reset file pointer after reading size (important for saving the file)
        file.seek(0)

        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if file:
            # Save the file to a temporary location
            pdf_path = os.path.join('uploads', file.filename)
            try:
                file.save(pdf_path)
            except Exception as e:
                return jsonify({"error": f"Error saving file: {e}"}), 500

            # Extract text from the uploaded PDF
            extracted_text = extract_text_from_pdf(pdf_path)

            if not extracted_text:
                return jsonify({"error": "Failed to extract text from PDF"}), 500

            # Extract relevant entities using spaCy
            extracted_data = extract_entities(extracted_text)

            if not extracted_data:
                return jsonify({"error": "Failed to extract relevant data"}), 500

            # Clean up: delete the uploaded file after processing
            try:
                os.remove(pdf_path)
            except Exception as e:
                print(f"Error deleting file: {e}")

            return jsonify(extracted_data)

    except Exception as e:
        print(f"Error in /extract route: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


if __name__ == '__main__':
    try:
        # Create the uploads directory if it doesn't exist
        if not os.path.exists('uploads'):
            os.makedirs('uploads')
        
        # Run the Flask app on port 5000
        app.run(host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"Error starting the Flask app: {e}")
