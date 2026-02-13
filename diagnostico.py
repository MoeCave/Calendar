"""
Script de diagnóstico para verificar tareas en MongoDB
Ejecuta esto para ver qué hay en tu base de datos
"""

from connectBD import connectBD
from bson import ObjectId
import json

def diagnosticar_tareas():
    print("🔍 DIAGNÓSTICO DE TAREAS EN MONGODB")
    print("=" * 60)
    
    db = connectBD()
    
    # 1. Contar tareas
    total_tareas = db.task.count_documents({})
    print(f"\n📊 Total de tareas en la BD: {total_tareas}")
    
    # 2. Mostrar todas las tareas
    if total_tareas > 0:
        print("\n📋 Lista de tareas:\n")
        tareas = list(db.task.find())
        
        for i, tarea in enumerate(tareas, 1):
            print(f"Tarea #{i}:")
            print(f"  _id:        {tarea.get('_id')}")
            print(f"  titol:      {tarea.get('titol', '❌ FALTA')}")
            print(f"  descripcio: {tarea.get('descripcio', '(vacío)')}")
            print(f"  limitDate:  {tarea.get('limitDate', '❌ FALTA')}")
            print(f"  color:      {tarea.get('color', '❌ FALTA')}")
            print(f"  completada: {tarea.get('completada', False)}")
            
            # Verificar si es válida
            es_valida = all([
                tarea.get('titol'),
                tarea.get('limitDate')
            ])
            print(f"  ✅ Válida:  {es_valida}")
            print()
    else:
        print("\n⚠️  No hay tareas en la base de datos")
    
    # 3. Buscar tareas corruptas
    print("\n🔎 Buscando tareas corruptas...")
    corruptas = list(db.task.find({
        "$or": [
            {"titol": {"$in": ["", None]}},
            {"limitDate": {"$in": ["", None]}},
            {"titol": {"$exists": False}},
            {"limitDate": {"$exists": False}}
        ]
    }))
    
    if corruptas:
        print(f"❌ Se encontraron {len(corruptas)} tareas corruptas:")
        for tarea in corruptas:
            print(f"  - ID: {tarea['_id']}")
            print(f"    Problema: {tarea}")
    else:
        print("✅ No hay tareas corruptas")
    
    # 4. Sugerencias
    print("\n" + "=" * 60)
    print("💡 ACCIONES SUGERIDAS:")
    
    if corruptas:
        print("\n1️⃣  Para LIMPIAR tareas corruptas, ejecuta:")
        print("    from connectBD import connectBD")
        print("    db = connectBD()")
        print("    db.task.delete_many({'$or': [")
        print("        {'titol': {'$in': ['', None]}},")
        print("        {'limitDate': {'$in': ['', None]}}")
        print("    ]})")
    
    if total_tareas == 0:
        print("\n2️⃣  Para CREAR tareas de ejemplo:")
        print("    from datetime import datetime")
        print("    db.task.insert_many([")
        print("        {")
        print("            'titol': 'Reunión importante',")
        print("            'descripcio': 'Presentación del proyecto',")
        print("            'limitDate': '2026-02-14',")
        print("            'color': '#3b82f6',")
        print("            'completada': False")
        print("        },")
        print("        {")
        print("            'titol': 'Comprar víveres',")
        print("            'descripcio': 'Mercado y farmacia',")
        print("            'limitDate': '2026-02-15',")
        print("            'color': '#22c55e',")
        print("            'completada': False")
        print("        }")
        print("    ])")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    diagnosticar_tareas()

"""
Borrar tareas corruptas

from connectBD import connectBD
db = connectBD()
db.task.delete_many({
    "$or": [
        {"titol": {"$in": ["", None]}},
        {"limitDate": {"$in": ["", None]}}
    ]
})
"""