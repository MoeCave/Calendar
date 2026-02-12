from flask import Flask, request, render_template, redirect, url_for
from connectBD import *

app = Flask(__name__)

db = connectBD()

def get_events():
    return list(db.event.find({}, {"_id": 0}))

def get_tasks():
    return list(db.task.find({}, {"_id": 0}))

@app.route('/')
def home():
    return render_template(
        "index.html",
        events=get_events(),
        tasks=get_tasks()
    )

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