from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ViewSet):
    """
    A ViewSet for managing tasks using DRF's base viewsets.ViewSet (not ModelViewSet).
    
    Endpoints:
    - GET /tasks/        -> list all tasks
    - POST /tasks/       -> create a new task
    - GET /tasks/{id}/   -> retrieve task by id
    - PUT /tasks/{id}/   -> update a task (title & description)
    - PATCH /tasks/{id}/ -> toggle task completed status only
    - DELETE /tasks/{id}/-> delete a task
    """

    def list(self, request):
        tasks = Task.objects.all().order_by('-created_at')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request):
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        task = get_object_or_404(Task, pk=pk)
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def update(self, request, pk=None):
        """Update a task (title & description)."""
        task = get_object_or_404(Task, pk=pk)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        """Toggle task completed status only."""
        task = get_object_or_404(Task, pk=pk)
        if 'completed' in request.data:
            # Supports passing explicit boolean completed state
            task.completed = bool(request.data.get('completed'))
        else:
            # Toggle completed status
            task.completed = not task.completed
        task.save(update_fields=['completed'])
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, pk=None):
        task = get_object_or_404(Task, pk=pk)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
