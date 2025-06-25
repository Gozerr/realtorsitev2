// Cypress E2E test for real-time chat

describe('Real-time Chat', () => {
  const testUser = { email: 'test.agent.662@example.com', password: 'qwerty123' };
  const companionUser = { email: 'test.agent.404@example.com', password: 'testpassword' };
  const testMessage = 'Тестовое сообщение ' + Date.now();

  it('User can send and see message in chat', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.setItem('tutorialCompleted', 'true');
      }
    });
    cy.get('#login_email').type(testUser.email);
    cy.get('#login_password').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Переход в чаты
    cy.contains('Чаты').click();

    // Открыть чат с нужным пользователем
    cy.contains(companionUser.email).click();

    // Дождаться появления поля для ввода сообщения и отправить сообщение
    cy.get('input[placeholder="Введите сообщение..."][type="search"]', { timeout: 10000 }).should('be.visible').type(testMessage);
    cy.contains('Отправить').click();

    // Проверить, что сообщение появилось в истории
    cy.contains(testMessage).should('be.visible');
  });
}); 