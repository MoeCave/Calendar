from flask import Flask, request, render_template, redirect, url_for, jsonify
from connectBD import *
from bson import ObjectId
from datetime import datetime

def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])  # ObjectId → stringa
    return doc

app = Flask(__name__)

db = connectBD()

def get_events():
    return list(db.event.find())

def get_tasks():
    return list(db.task.find())

@app.route('/')
def home():
    events = [serialize_doc(e) for e in get_events()]
    tasks = [serialize_doc(t) for t in get_tasks()]

    return render_template(
        "index.html",
        events=events,
        tasks=tasks
    )

@app.route('/api/dades')
def get_dades():
    dades = list(db.colleccio.find())
    # Convertir ObjectId a string
    for item in dades:
        item['_id'] = str(item['_id'])
    return jsonify(dades)

@app.route('/record', methods=['POST'])
def add_record():
    form_type = request.form.get('type')

    if form_type == "task":
        task = {
            "titol": request.form.get('titol'),
            "descripcio": request.form.get('descripcio', ''),
            "limitDate": request.form.get('limitDate', ''),
            "endDate": request.form.get('endDate', ''),      # ← NUEVO
            "duration": int(request.form.get('duration', 1)), # ← NUEVO
            "color": request.form.get('color', 'purple'),
            "completada": False
        }

        result = db.task.insert_one(task)
        
        return jsonify({"success": True, "id": str(result.inserted_id)})

    elif form_type == "event":
        event = {
            "title": request.form.get('titol'),
            "description": request.form.get('descripcio', ''),
            "startTime": request.form.get('startTime'),
            "endTime": request.form.get('endTime'),
            "color": request.form.get('color', 'blue')
        }

        db.event.insert_one(event)
        return jsonify({"success": True})

    return redirect(url_for('home'))

@app.route('/task/<task_id>/editar', methods=['POST'])
def edit_task(task_id):
    update_data = {
        "titol": request.form.get('titol'),
        "descripcio": request.form.get('descripcio', '')
    }
    
    # Si se proporciona endDate, actualizarlo también
    if request.form.get('endDate'):
        update_data['endDate'] = request.form.get('endDate')
    
    db.task.update_one(
        {"_id": ObjectId(task_id)}, 
        {"$set": update_data}
    )
    return '', 204

@app.route('/task/<task_id>/eliminar', methods=['POST'])
def delete_task(task_id):
    db.task.delete_one({"_id": ObjectId(task_id)})
    return '', 204

@app.route('/task/<task_id>/actualizar-fechas', methods=['POST'])
def update_task_dates(task_id):
    limit_date = request.form.get('limitDate')
    end_date = request.form.get('endDate')
    
    # Calcular la duración en días
    from datetime import datetime
    start = datetime.strptime(limit_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    duration = (end - start).days
    
    db.task.update_one(
        {"_id": ObjectId(task_id)}, 
        {"$set": {
            "limitDate": limit_date,
            "endDate": end_date,
            "duration": duration
        }}
    )
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)