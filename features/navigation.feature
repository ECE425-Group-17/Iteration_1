Feature: Navigation between public pages

  Scenario: User visits the login page
    Given I open the app at "/"
    Then I should see "Sign In"

  Scenario: User goes to the sign up page
    Given I open the app at "/"
    When I click the element with id "goSignupBtn"
    Then the current path should be "/signup"
    And I should see "Create Account"

  Scenario: User goes to the reset password page
    Given I open the app at "/"
    When I click the element with id "goResetBtn"
    Then the current path should be "/reset-password"
    And I should see "Reset Password"

  Scenario: User goes to the landing page
    Given I open the app at "/landing"
    Then I should see "Welcome"
    And I should see "Go to Login"