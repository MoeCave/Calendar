from flask import Flask, request, render_template, redirect, url_for, jsonify
from connectBD import * # Connected to the MongoDB database
from bson import ObjectId # To convert ObjectId to a string and vice versa
from datetime import datetime

# Functioned to serialize MongoDB documents
def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc

app = Flask(__name__)

db = connectBD() # Connect to DataBase

#Functions to get lists of documents from MongoDB
def get_tasks():
    return list(db.task.find())

# MAIN ROUTE: Show the main page with events and tasques
@app.route('/')
def home():
    tasks = [serialize_doc(t) for t in get_tasks()] # Serialize ObjectId to string

    return render_template(
        "index.html",
        tasks=tasks
    )

# API to obtain data from a generic collection
@app.route('/api/dades')
def get_dades():
    dades = list(db.colleccio.find())
    # Convert ObjectId to string but to JSON
    for item in dades:
        item['_id'] = str(item['_id'])
    return jsonify(dades)

# Route to register a record
@app.route('/record', methods=['POST'])
def add_record():

    task = {
        "titol": request.form.get('titol'),
        "descripcio": request.form.get('descripcio', ''),
        "limitDate": request.form.get('limitDate', ''),
        "duration": int(request.form.get('duration', 1)), # ← NUEVO
        "color": request.form.get('color', 'purple'),
        "completada": False
    }

    return redirect(url_for('home'))

# Route to edit an existing tavern
@app.route('/task/<task_id>/editar', methods=['POST'])
def edit_task(task_id):
    update_data = {
        "titol": request.form.get('titol'),
        "descripcio": request.form.get('descripcio', '')
    }
    
    # If endDate is provided, update it as well
    if request.form.get('endDate'):
        update_data['endDate'] = request.form.get('endDate')
    
    db.task.update_one(
        {"_id": ObjectId(task_id)}, # Search document by _id
        {"$set": update_data} # Update provided camps
    )
    return '', 204

# Route to eliminate en event
@app.route('/task/<task_id>/eliminar', methods=['POST'])
def delete_task(task_id):
    db.task.delete_one({"_id": ObjectId(task_id)})
    return '', 204

# Route to update the dates of a restaurant and calculate the duration
@app.route('/task/<task_id>/actualizar-fechas', methods=['POST'])
def update_task_dates(task_id):
    limit_date = request.form.get('limitDate')
    end_date = request.form.get('endDate')
    
    # Convert strings to datetime objects
    start = datetime.strptime(limit_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')

    # Calculate the duration in days 
    duration = (end - start).days 
    
    # Update document with new dates and duration
    db.task.update_one(
        {"_id": ObjectId(task_id)}, 
        {"$set": {
            "limitDate": limit_date,
            "endDate": end_date,
            "duration": duration
        }}
    )
    return '', 204

# Start the Flask application
if __name__ == '__main__':
    app.run(debug=True)