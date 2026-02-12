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
    if (request.form['type']) == "task":
        task = {
        "titol": request.form['titol'],
        "descripcio": request.form.get('descripcio', ''),
        "limitDate": request.form.get('descripcio', ''),
        "color": request.form.get('descripcio', 'purple'),
        "completada": False
        }
        db.task.insert_one(task)
        return "Task saved successfully"
    elif (request.form['type']) == "event":
        event = {
        "title": request.form['titol'],
        "description": request.form.get('descripcio', ''),
        "starTime": request.form['titol'],
        "endTime": request.form['titol'],
        "color": request.form.get('descripcio', 'blue')
        }
        db.event.insert_one(event)
        return "Event saved successfully"

    return redirect(url_for('home'))

@app.route('/task/<titol>/completar', methods=['POST'])
def complete_task(titol):
    db.task.update_one({"titol": titol}, {"$set": {"completada": True}})
    return redirect(url_for('home'))

@app.route('/task/<titol>/eliminar', methods=['POST'])
def delete_task(titol):
    db.task.delete_one({"titol": titol})
    return redirect(url_for('home'))

@app.route('/event/<titol>/eliminar', methods=['POST'])
def delete_event(titol):
    db.event.delete_one({"titol": titol})
    return redirect(url_for('home'))



if __name__ == '__main__':
    app.run(debug=True)