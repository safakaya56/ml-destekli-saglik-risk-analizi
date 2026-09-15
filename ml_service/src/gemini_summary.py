"""
Google Gemini API Clinical Summary Generator.
Synthesizes ML risk probabilities and SHAP key factors into natural language summaries.
"""

import os
import json
from google import genai
from google.genai import types


SYSTEM_INSTRUCTION = """
Sen uzman bir yapay zeka klinik karar destek asistanısın.
Görevin; hastanın laboratuvar değerlerini, makine öğrenmesi risk olasılıklarını ve SHAP faktörlerini analiz ederek Türkçe dilinde net, empatik ve hastanın RAHATÇALIKLA ANLAYABİLECEĞİ sade bir dille klinik özet üretmektir.

KRİTİK KURALLAR VE DALLANMA MANTIĞI:
1. `summary` (Klinik Genel Sağlık Durumu):
   - Hastanın genel sağlık durumunu karmaşık tıbbi terimlere, ağır klinik jargonlara girmeden, günlük ve anlaşılır bir dille özetle. Hastanın raporu okuduğunda kendi sağlık durumunu net bir şekilde anlamasını sağla.

2. `recommendations` (Sağlıklı Yaşam ve Yaşam Tarzı Tavsiyeleri - RİSK DÜZEYİNE GÖRE DALLANMA):
   - YÜKSEK RİSKLİ / DOKTOR RANDEVUSU GEREKTİREN DURUMLAR:
     * KESİNLİKLE "EKG çektirin", "Eko yaptırın", "Tahlil yaptırın", "Kardiyolojiye/Doktora gidin" gibi klinik test veya tıbbi tetkik tavsiyeleri VERME! Zaten hastanın riski yüksek olduğu için doktor muayenesine yönlendirilecek ve hangi tetkikin yapılacağına doktoru karar verecektir.
     * Bunun yerine hastanın evde kendi başına uygulayabileceği günlük yaşam tarzı ve öz bakım tavsiyeleri ver (Örn: Tuz kullanımını kısıtlama, günlük 2-2.5 litre su tüketimi, basit şekerden kaçınma, evde düzenli tansiyon/şeker takibi yapıp not alma, sigarayı bırakma ve randevu gününe kadar kendine dikkat etme).
   - DÜŞÜK VE ORTA RİSKLİ DURUMLAR:
     * Koruyucu ve sağlıklı yaşam tavsiyeleri ver (Örn: Akdeniz tipi dengeli beslenme, haftada 150 dakika tempolu yürüyüş, kaliteli uyku, rutin yıllık aile hekimi kontrolleri).

3. Tıbbi Teşhis Koyma:
   - Kesin tıbbi teşhis koyma ("Kesin hastasınız" gibi ifadeler kullanma).

4. Çıktı Formatı:
   - Çıktı kesinlikle belirtilen JSON formatında olmalıdır.
"""

JSON_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "summary": {"type": "STRING", "description": "Hastanın rahatça anlayabileceği sade ve günlük dille genel klinik sağlık durumu özeti."},
        "findings": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Hastanın anlayacağı sadelikte tespit edilen klinik bulgular."
        },
        "recommendations": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Hastanın risk durumuna uygun kişiselleştirilmiş yaşam tarzı ve beslenme tavsiyeleri."
        },
        "disclaimer": {"type": "STRING", "description": "Standart bilgilendirme notu."}
    },
    "required": ["summary", "findings", "recommendations", "disclaimer"]
}


def generate_dynamic_clinical_advice(patient_info: dict, predictions: dict) -> dict:
    """Builds rich, specific Turkish clinical advice based on lab values and risk scores without test commands for high risk."""
    recs = []
    findings = []
    
    gl = patient_info.get("glucose", 100)
    hb = patient_info.get("hba1c", 5.5)
    sbp = patient_info.get("systolic_bp", 120)
    dbp = patient_info.get("diastolic_bp", 80)
    cr = patient_info.get("creatinine", 0.9)
    tc = patient_info.get("total_cholesterol", 190)
    
    p_diab = predictions.get("diabetes", {})
    p_cvd = predictions.get("cardiovascular", {})
    p_kidney = predictions.get("kidney", {})
    
    is_high_risk = (
        p_diab.get("risk_label") == "Yüksek Risk" or
        p_cvd.get("risk_label") == "Yüksek Risk" or
        p_kidney.get("risk_label") == "Yüksek Risk" or
        hb >= 6.5 or gl >= 126 or sbp >= 140 or dbp >= 90 or cr >= 1.3
    )

    # 1. Glycemic / Diabetes Evaluation
    if p_diab.get("risk_label") == "Yüksek Risk" or hb >= 6.5 or gl >= 126:
        findings.append(f"Kan şekeri ({gl} mg/dL) ve HbA1c (%{hb}) değerleriniz normal referans aralığının üzerindedir.")
        recs.append("Özellikle paketli gıdalar, rafine şekerler ve hamur işlerinden kaçınarak lifli gıdalar (sebze ve bakliyat) tercih edin.")
        recs.append("Gün içerisinde kan şekeri dalgalanmalarını önlemek için öğünlerinizi düzenli saatlerde tüketin.")
    elif p_diab.get("risk_label") == "Orta Risk" or hb >= 5.7 or gl >= 100:
        findings.append(f"Kan şekeri değerleriniz ({gl} mg/dL) gizli şeker (prediyabet) sınırında seyretmektedir.")
        recs.append("Glisemik indeksi düşük besinler tüketerek kilo kontrolünüze özen gösterin.")

    # 2. Cardiovascular / Blood Pressure Evaluation
    if p_cvd.get("risk_label") == "Yüksek Risk" or sbp >= 140 or dbp >= 90:
        findings.append(f"Kan basıncı değerleriniz ({sbp}/{dbp} mmHg) yüksek seyretmektedir.")
        recs.append("Günlük tuz tüketimini belirgin şekilde kısıtlayın (günde en fazla 1 çay kaşığı) ve işlenmiş şarküteri ürünlerinden kaçının.")
        recs.append("Sabah ve akşam saatlerinde dinlenik vaziyette tansiyonunuzu ölçüp bir deftere not edin.")
    elif tc >= 200 or sbp >= 130 or dbp >= 80:
        findings.append(f"Kan basıncınız veya kolesterol seviyeniz ({tc} mg/dL) takip gerektiren sınırda yer almaktadır.")
        recs.append("Doymuş yağ oranını azaltıp zeytinyağı ve sebze ağırlıklı Akdeniz tipi beslenmeye ağırlık verin.")

    # 3. Renal / Kidney Evaluation
    if p_kidney.get("risk_label") == "Yüksek Risk" or cr >= 1.3:
        findings.append(f"Böbrek süzme göstergeniz olan serum kreatinin ({cr} mg/dL) değeriniz yüksek bulunmuştur.")
        recs.append("Böbrek sağlığınızı desteklemek için gün boyunca düzenli olarak 2 - 2.5 litre su içmeye özen gösterin.")
        recs.append("Bilinçsiz ve kontrolsüz ağrı kesici (NSAİİ grubu ilaçlar) kullanımından kesinlikle kaçının.")
    else:
        recs.append("Vücudunuzun su dengesini korumak için günlük sıvı alımınızı ihmal etmeyin.")

    if is_high_risk:
        recs.append("Doktor randevunuza kadar olan süreçte beslenme ve günlük yaşam tarzı tavsiyelerine hassasiyetle uyunuz.")
    else:
        recs.append("Haftada en az 4-5 gün 30 dakikalık tempolu yürüyüşler yaparak aktif bir yaşam sürdürün.")
        recs.append("Yıllık rutin genel sağlık kontrolleriniz için aile hekiminizi ziyaret etmeyi unutmayın.")

    if not findings:
        findings = ["Tüm laboratuvar ölçümleriniz genel olarak sağlık standartlarına uygun görünmektedir."]

    # General Health Summary in plain Turkish
    if is_high_risk:
        summary_text = "Genel sağlık değerlendirmenize göre bazı laboratuvar değerlerinizde (şeker, tansiyon veya böbrek fonksiyonları) takibi gereken yükseklikler saptanmıştır. Sağlığınızı korumak adına önerilen günlük yaşam alışkanlıklarına dikkat etmeniz önem taşımaktadır."
    elif any(p.get("risk_label") == "Orta Risk" for p in predictions.values()):
        summary_text = "Genel sağlık durumunuz genel olarak dengeli olmakla birlikte, bazı değerleriniz sınırda seyretmektedir. Yaşam tarzınızda yapacağınız küçük olumlu değişikliklerle risklerinizi en aza indirebilirsiniz."
    else:
        summary_text = "Genel klinik sağlık durumunuz oldukça stabil ve değerleriniz referans aralıkları içerisindedir. Mevcut sağlıklı yaşam alışkanlıklarınızı sürdürmeniz önerilir."

    return {
        "summary": summary_text,
        "findings": findings,
        "recommendations": list(dict.fromkeys(recs)), # deduplicated list
        "disclaimer": "Bu değerlendirme bilgilendirme amaçlıdır. Kesin teşhis ve tedavi planı için lütfen doktorunuza danışınız."
    }


def generate_clinical_summary(patient_info: dict, predictions: dict, shap_explanations: dict) -> dict:
    """Generates natural language clinical decision support summary using Gemini API."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Try Gemini API if key exists
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            prompt_data = {
                "patient": patient_info,
                "predictions": predictions,
                "shap_top_factors": shap_explanations
            }

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=json.dumps(prompt_data, ensure_ascii=False),
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.2,
                    response_mime_type="application/json",
                    response_schema=JSON_SCHEMA,
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini API Error: {e}")

    # Rich dynamic clinical advice fallback
    return generate_dynamic_clinical_advice(patient_info, predictions)
