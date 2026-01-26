import { test, expect } from '@playwright/test';

const PASSWORD = '1108'; // Tvoje heslo
const WRONG_PASSWORD = 'heslo123';
const BORROWER = `Tester_${Date.now()}`; // Unikátní jméno (např. Tester_1706185230)

test.describe('Komplexní Stress Test Skladu', () => {

  test('Scénář: Zmatený skladník (Chyby, Validace, Košík, Vrácení)', async ({ page }) => {
    
    // --- 1. POKUS O PŘIHLÁŠENÍ ŠPATNÝM HESLEM ---
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="password"]', WRONG_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Ověříme, že vyskočila chyba
    await expect(page.getByText('Nesprávné heslo!')).toBeVisible();

    // --- 2. ÚSPĚŠNÉ PŘIHLÁŠENÍ ---
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.getByPlaceholder('Hledat...')).toBeVisible();

    // --- 3. POKUS O VÝPŮJČKU BEZ JMÉNA (Validace) ---
    await page.getByRole('button', { name: 'Vypůjčit' }).first().click();
    
   // --- FIX: Search for an item with high stock to avoid disabled buttons ---
    await page.fill('input[placeholder="Hledat..."]', 'Hmoždinky');
    await expect(page.getByText('Hmoždinky 8mms')).toBeVisible(); // Wait for filter

    // Zkusíme potvrdit prázdný formulář (nebo s prázdným košíkem)
    // Nejdřív musíme něco dát do košíku, aby tlačítko Potvrdit nebylo disabled (pokud je disabled logiku máš)
    // Najdeme první "Plus" tlačítko
    const firstPlusBtn = page.locator('button:has(svg.lucide-plus)').first();
    await firstPlusBtn.click();

    // Teď zkusíme potvrdit bez jména
    const confirmBtn = page.getByRole('button', { name: 'Potvrdit výpůjčku' });
    await confirmBtn.click();

    // Ověříme, že jsme stále v režimu půjčování (tlačítko tam pořád je)
    await expect(confirmBtn).toBeVisible(); 
    // Poznámka: Playwright je tak rychlý, že alert se někdy těžko chytá, ale hlavně že nás to nepustilo dál.

    // --- 4. HRÁTKY S KOŠÍKEM (Přidat, Ubrat, Vše) ---
    // Zadáme jméno
    await page.fill('input[placeholder="Jméno (kdo si půjčuje?)"]', BORROWER);

    // Najdeme nějakou položku (třeba tu první)
    // Klikneme 3x PLUS
    await firstPlusBtn.click();
    await firstPlusBtn.click();
    await firstPlusBtn.click();

    // Zkontrolujeme, že tam je číslo 4 (1 z minula + 3 teď)
    // Musíme najít ten span s počtem v rámci prvního řádku
    // Toto je trochu "duchařina" s lokátory, zkusíme najít text "4" v oranžovém poli
    await expect(page.getByText('4', { exact: true }).first()).toBeVisible();

    // Klikneme 2x MÍNUS
    const firstMinusBtn = page.locator('button:has(svg.lucide-minus)').first();
    await firstMinusBtn.click();
    await firstMinusBtn.click();

    // Teď zkusíme tlačítko "VŠE" (ChevronsRight)
    const allBtn = page.locator('button:has(svg.lucide-chevrons-right)').first();
    await allBtn.click();

    // Teď by měl být košík plný (tlačítko plus by mělo být disabled, nebo prostě hodně kusů)
    // Potvrdíme výpůjčku
    await confirmBtn.click();

    // Počkáme na loading
    await expect(page.getByText('Pracuji na tom...')).toBeHidden();

    // --- 5. KONTROLA VÝPŮJČKY V SEZNAMU ---
    // Do vyhledávání napíšeme jméno, mělo by to najít položku s naším jménem
    await page.fill('input[placeholder="Hledat..."]', BORROWER);
    // Hledáme text "Tester_... : Xks"
    await expect(page.getByText(`${BORROWER} :`)).toBeVisible();


    // --- 6. VRÁCENÍ (Testujeme logiku "Nejdřív jméno") ---
    // Vymažeme hledání
    await page.fill('input[placeholder="Hledat..."]', '');

    await page.getByRole('button', { name: 'Vrátit' }).first().click();

    // BUG CHECK: Zkusíme zadat neexistující jméno
    await page.fill('input[placeholder="Zadejte jméno..."]', 'Duch_co_neexistuje');
    await page.getByRole('button', { name: 'Zobrazit výpůjčky' }).click();

    // Mělo by to napsat "Žádné výpůjčky nenalezeny" nebo seznam bude prázdný
    await expect(page.getByText('Žádné výpůjčky nenalezeny')).toBeVisible();

    // --- 7. VRÁCENÍ (Opravdu vrátit) ---
    // Klikneme Zpět
    await page.getByText('Zpět na přehled').click(); // Nebo tlačítko X v hlavičce

    // Znovu Vratit -> Správné jméno
    await page.getByRole('button', { name: 'Vrátit' }).first().click(); // Někdy se mode resetuje, pro jistotu
    await page.fill('input[placeholder="Zadejte jméno..."]', BORROWER);
    await page.getByRole('button', { name: 'Zobrazit výpůjčky' }).click();

    // Teď bychom měli vidět tu položku. Vrátíme vše (klikneme na VŠE)
    await page.locator('button:has(svg.lucide-chevrons-right)').first().click();
    
    // Potvrdit vrácení
    await page.getByRole('button', { name: 'Potvrdit vrácení' }).click();
    await expect(page.getByText('Pracuji na tom...')).toBeHidden();

    // --- 8. FINÁLNÍ KONTROLA (Čistý stůl) ---
    // Jméno by mělo zmizet ze seznamu
    await expect(page.getByText(`${BORROWER} :`)).toBeHidden();
  });
});