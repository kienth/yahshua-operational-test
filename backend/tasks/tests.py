from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from .models import Task


class TaskAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.task1 = Task.objects.create(
            title="Initial Task 1",
            description="First task description",
            completed=False
        )
        self.task2 = Task.objects.create(
            title="Initial Task 2",
            description="Second task description",
            completed=True
        )

    def test_list_tasks(self):
        """GET /tasks/ should return all tasks."""
        response = self.client.get('/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_task_success(self):
        """POST /tasks/ should create a task with title and optional description."""
        payload = {
            "title": "New Task",
            "description": "Optional notes about the task",
            "completed": False
        }
        response = self.client.post('/tasks/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "New Task")
        self.assertEqual(response.data['description'], "Optional notes about the task")
        self.assertFalse(response.data['completed'])
        self.assertTrue(Task.objects.filter(id=response.data['id']).exists())

    def test_create_task_without_description(self):
        """POST /tasks/ without description should succeed (description is optional)."""
        payload = {"title": "Task without description"}
        response = self.client.post('/tasks/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "Task without description")
        self.assertEqual(response.data['description'], "")

    def test_create_task_invalid_missing_title(self):
        """POST /tasks/ without title should return 400 Bad Request."""
        payload = {"description": "Missing title"}
        response = self.client.post('/tasks/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)

    def test_retrieve_task(self):
        """GET /tasks/{id}/ should retrieve a specific task."""
        response = self.client.get(f'/tasks/{self.task1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.task1.id)
        self.assertEqual(response.data['title'], self.task1.title)

    def test_retrieve_nonexistent_task(self):
        """GET /tasks/{id}/ for non-existing id should return 404."""
        response = self.client.get('/tasks/999999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_task_put(self):
        """PUT /tasks/{id}/ should update title & description."""
        payload = {
            "title": "Updated Task Title",
            "description": "Updated Task Description"
        }
        response = self.client.put(f'/tasks/{self.task1.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.title, "Updated Task Title")
        self.assertEqual(self.task1.description, "Updated Task Description")

    def test_patch_toggle_task_completed(self):
        """PATCH /tasks/{id}/ should toggle completed status."""
        # Initial status is False
        self.assertFalse(self.task1.completed)

        # Toggle to True
        response1 = self.client.patch(f'/tasks/{self.task1.id}/', {}, format='json')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.task1.refresh_from_db()
        self.assertTrue(self.task1.completed)

        # Toggle back to False
        response2 = self.client.patch(f'/tasks/{self.task1.id}/', {}, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.task1.refresh_from_db()
        self.assertFalse(self.task1.completed)

    def test_patch_with_explicit_completed_boolean(self):
        """PATCH /tasks/{id}/ with explicit completed boolean."""
        response = self.client.patch(f'/tasks/{self.task1.id}/', {"completed": True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task1.refresh_from_db()
        self.assertTrue(self.task1.completed)

    def test_delete_task(self):
        """DELETE /tasks/{id}/ should delete the task and return 204."""
        response = self.client.delete(f'/tasks/{self.task1.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=self.task1.id).exists())
