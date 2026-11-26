from flask import Flask, request, render_template, redirect, url_for, jsonify
from connectBD import * # Connected to the MongoDB database
from bson import ObjectId # To convert ObjectId to a string and vice versa
from datetime import datetime
import uuid

# Functioned to serialize MongoDB documents
def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc

app = Flask(__name__)

db = connectBD() # Connect to DataBase
fallback_tasks = [] # In-memory fallback when MongoDB is unavailable

#Functions to get lists of documents from MongoDB
def get_tasks():
    try:
        return list(db.task.find())
    except Exception as e:
        print(f"⚠️ MongoDB unavailable ({e}); using in-memory fallback.")
        return list(fallback_tasks)

# MAIN ROUTE: Show the main page with events and tasques
@app.route('/')
def home():
    tasks = [serialize_doc(dict(t)) for t in get_tasks()] # Serialize ObjectId to string

    return render_template(
        "index.html",
        tasks=tasks
    )

# API to obtain data from a generic collection
@app.route('/api/dades')
def get_dades():
    try:
        dades = list(db.colleccio.find())
        # Convert ObjectId to string but to JSON
        for item in dades:
            item['_id'] = str(item['_id'])
        return jsonify(dades)
    except Exception as e:
        return jsonify({"error": str(e)}), 503

# Route to register a record
@app.route('/record', methods=['POST'])
def add_record():
    form_type = request.form.get('type')
    
    if form_type == "task":
        task = {
            "titol": request.form.get('titol'),
            "descripcio": request.form.get('descripcio', ''),
            "limitDate": request.form.get('limitDate', ''),
            "endDate": request.form.get('endDate', ''),
            "duration": int(request.form.get('duration', 1)),
            "color": request.form.get('color', '#111827'),
            "completada": False
        }
        try:
            result = db.task.insert_one(task)
            return jsonify({"success": True, "id": str(result.inserted_id)})
        except Exception as e:
            print(f"⚠️ MongoDB insert failed ({e}); storing in memory.")
            local_id = f"local_{uuid.uuid4().hex[:12]}"
            task["_id"] = local_id
            fallback_tasks.append(task)
            return jsonify({"success": True, "id": local_id, "fallback": True})

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
    
    try:
        db.task.update_one(
            {"_id": ObjectId(task_id)}, # Search document by _id
            {"$set": update_data} # Update provided camps
        )
    except Exception:
        for task in fallback_tasks:
            if str(task.get("_id")) == task_id:
                task.update(update_data)
                break
    return '', 204

# Route to eliminate en event
@app.route('/task/<task_id>/eliminar', methods=['POST'])
def delete_task(task_id):
    try:
        db.task.delete_one({"_id": ObjectId(task_id)})
    except Exception:
        fallback_tasks[:] = [t for t in fallback_tasks if str(t.get("_id")) != task_id]
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
    
    update_fields = {
        "limitDate": limit_date,
        "endDate": end_date,
        "duration": duration
    }
    try:
        # Update document with new dates and duration
        db.task.update_one(
            {"_id": ObjectId(task_id)}, 
            {"$set": update_fields}
        )
    except Exception:
        for task in fallback_tasks:
            if str(task.get("_id")) == task_id:
                task.update(update_fields)
                break
    return '', 204

# Start the Flask application
if __name__ == '__main__':
    app.run(debug=True)