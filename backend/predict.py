import sys
import json
import numpy as np
from PIL import Image

# Works on Windows - uses tensorflow instead of tflite_runtime
import tensorflow as tf

MODEL_PATH = "waste_model.tflite"
LABELS_PATH = "class_labels.json"

def predict(image_path):
    # Load TFLite model
    interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Load and preprocess image
    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # Run prediction
    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()
    predictions = interpreter.get_tensor(output_details[0]['index'])[0]

    # Load class labels
    with open(LABELS_PATH, "r") as f:
        class_labels = json.load(f)

    predicted_index = str(np.argmax(predictions))
    confidence = float(np.max(predictions)) * 100
    class_name = class_labels.get(predicted_index, "unknown")

    top3_indices = np.argsort(predictions)[::-1][:3]
    top3 = [
        {
            "class": class_labels.get(str(i), "unknown"),
            "confidence": round(float(predictions[i]) * 100, 2)
        }
        for i in top3_indices
    ]

    print(json.dumps({
        "class": class_name,
        "confidence": round(confidence, 2),
        "top3": top3
    }))

if __name__ == "__main__":
    image_path = sys.argv[1]
    predict(image_path)