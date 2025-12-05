# 📱 Aplikacja Grywalizacyjna – React Native + Expo

**Aplikacja mobilna wspierająca produktywność poprzez mechanizmy grywalizacji.**

Projekt ma na celu zwiększenie zaangażowania użytkownika w wykonywanie codziennych zadań poprzez system nagród. Użytkownik zdobywa **punkty doświadczenia (XP)**, wykonuje zadania, rozwija swoją postać i personalizuje profil.

---

## 🎯 Główne funkcjonalności

### 👤 Profil użytkownika

* **Autentykacja (Firebase Authentication):**
    * Logowanie i rejestracja.
* **Edycja Danych:**
    * Inline edycja nicku z przyciskami akcji: "Zmień tekst", "Zapisz", "Anuluj".
    * Zmiana hasła w **modalu** (wymaga podania starego hasła do reautentykacji) z **walidacją** nowego hasła (długość, cyfra, znak specjalny, potwierdzenie).
* **Avatar:**
    * Ustawianie/zmiana avatara z **galerii** urządzenia (wykorzystanie `expo-image-picker`).
    * Przechowywanie obrazu w **Firebase Storage** i jego URL w **Cloud Firestore**.

### 🧙‍♂️ Postać i statystyki

* **Ekran "Postać":** Wyświetlanie kluczowych parametrów postaci:
    * **XP** (`XP / maxXp`)
    * **Zdrowie** (`health / maxHealth`)
    * **Głód** (`hunger / maxHunger`)
    * **Poziom** (`level`)
* **Wizualizacja:** Prezentacja statystyk za pomocą dedykowanego komponentu **ProgressBar**.
* **Spójność Danych:** Ujednolicone dane XP wykorzystywane zarówno na ekranie **"Postać"**, jak i na **pasku XP w TopBarze**.

### ✅ Zadania

* Lista **bieżących zadań** użytkownika.
* Możliwość **dodawania nowych zadań**.
* **Zarządzanie stanem** zadań (np. oznaczanie jako wykonane).
* Dane zadań przechowywane **per użytkownik w Cloud Firestore**.

### 🧭 Nawigacja i UI

* **Górny pasek (TopBar):**
    * Przycisk **menu** (otwierający boczne menu).
    * Pasek **XP** (`ProgressBar`).
    * Okrągły **avatar** (miniatura zdjęcia z profilu).
* **Dolny pasek (NavBar):** Zakładki główne:
    * `Home`
    * `Zadania`
    * `Postać`
* **Boczne menu (SideMenu):** Pełna nawigacja po aplikacji:
    * `Home` (`/`)
    * `Zadania` (`/tasks`)
    * `Postać` (`/character`)
    * `Ustawienia` (`/settings`)
* **Modal profilu:** Wyświetlany po kliknięciu w avatar, zawiera:
    * **Nick** i **adres e-mail** użytkownika.
    * Przycisk **"Ustawienia"**.
    * Przycisk **"Wyloguj"**.

---

## 🛠 Wykorzystane technologie

Projekt został zbudowany przy użyciu nowoczesnego ekosystemu mobilnego:

* **React Native + Expo**
* **Expo Router** (do nawigacji)
* **Styled Components** (do stylizacji)
* **Firebase Authentication**
* **Cloud Firestore**
* **Firebase Storage**
* **React Native Gesture Handler**
* **React Native Reanimated**

---

## ▶️ Uruchamianie projektu

Aby uruchomić aplikację lokalnie, wykonaj poniższe kroki.

1.  **Klonowanie repozytorium** (jeśli nie zostało jeszcze zrobione).
2.  **Instalacja zależności:**

    ```bash
    npm install
    ```

3.  **Uruchomienie aplikacji w trybie deweloperskim:**

    ```bash
    npx expo start
    ```

4.  **Dostęp do aplikacji:** Po uruchomieniu serwera Expo, możesz:
    * Zeskanować **kod QR** w aplikacji **Expo Go** (Android / iOS).
    * Uruchomić projekt w **Android Emulator**.
    * Uruchomić projekt w **iOS Simulator**.
    * Uruchomić aplikację w przeglądarce (tryb web).

---

## 📚 Przydatne linki

* Dokumentacja React Native: [https://reactnative.dev](https://reactnative.dev)
* Dokumentacja Expo: [https://docs.expo.dev](https://docs.expo.dev)
* Dokumentacja Firebase: [https://firebase.google.com/docs](https://firebase.google.com/docs)

---

## 👨‍💻 Autor

Projekt tworzony jako aplikacja grywalizacyjna wspierająca produktywność i rozwój użytkownika w ramach **pracy inżynierskiej / projektu studenckiego**.
